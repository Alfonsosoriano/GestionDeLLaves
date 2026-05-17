<?php

namespace App\Controller;

use App\Repository\LlaveRepository;
use App\Repository\UsuarioRepository;
use App\Service\RegistroService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

// Controlador para la gestión de entregas y devoluciones de llaves.
#[Route('/api/registros')]
class RegistroController extends AbstractController
{
    public function __construct(
        private readonly RegistroService $registroService,
        private readonly LlaveRepository $llaveRepository,
        private readonly UsuarioRepository $usuarioRepository
    ) {}

    /*
    Endpoint para buscar información de una llave o usuario mediante código de barras.
    Útil para la vista previa en el frontend antes de registrar.
    */
    #[Route('/info/{codigoBarras}', name: 'api_registro_info', methods: ['GET'])]
    public function obtenerInfoPorCodigo(string $codigoBarras): JsonResponse
    {
        // Buscar si es un usuario
        $usuario = $this->usuarioRepository->findOneBy(['codigoBarras' => $codigoBarras]);
        if ($usuario) {
            return $this->json([
                'tipo' => 'usuario',
                'datos' => [
                    'id' => $usuario->getId()?->toRfc4122(),
                    'nombre' => $usuario->getNombre(),
                    'rol' => $usuario->getRol()
                ]
            ]);
        }

        // Buscar si es una llave
        $llave = $this->llaveRepository->findOneBy(['codigoBarras' => $codigoBarras]);
        if ($llave) {
            return $this->json([
                'tipo' => 'llave',
                'datos' => [
                    'id' => $llave->getId()?->toRfc4122(),
                    'codigoBarras' => $llave->getCodigoBarras(),
                    'descripcion' => $llave->getDescripcion(),
                    'estado' => $llave->getEstado()
                ]
            ]);
        }

        return $this->json(['error' => 'Código no reconocido'], Response::HTTP_NOT_FOUND);
    }

    // Punto de acceso para realizar la entrega de una llave.
    #[Route('/entregar', name: 'api_registro_entregar', methods: ['POST'])]
    public function entregar(Request $request): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);
        
        $idUsuario = $datos['usuario_id'] ?? null;
        $idLlave = $datos['llave_id'] ?? null;
        $observaciones = $datos['observaciones'] ?? null;
        $nombrePersona = $datos['nombre_persona'] ?? null;

        if (!$idUsuario || !$idLlave) {
            return $this->json(['error' => 'Faltan datos obligatorios (usuario o llave)'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $registro = $this->registroService->entregarLlave($idUsuario, $idLlave, $observaciones, $nombrePersona);
            return $this->json($registro, Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error interno: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // Punto de acceso para realizar la devolución de una llave.
    #[Route('/devolver', name: 'api_registro_devolver', methods: ['POST'])]
    public function devolver(Request $request, \App\Repository\RegistroRepository $registroRepository): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);
        
        $idLlave = $datos['llave_id'] ?? null;
        $observaciones = $datos['observaciones'] ?? null;
        $idOrdenanza = $datos['ordenanza_id'] ?? null;

        if (!$idLlave) {
            return $this->json(['error' => 'Faltan datos obligatorios (llave)'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $registroActivo = $registroRepository->findRegistroActivoPorLlave($idLlave);
            if (!$registroActivo) {
                return $this->json(['error' => 'La llave no se encuentra prestada o no tiene un registro de entrega activo.'], Response::HTTP_BAD_REQUEST);
            }

            $registroIdCadena = $registroActivo->getId()?->toRfc4122();

            $registro = $this->registroService->devolverLlave($registroIdCadena, $observaciones, $idOrdenanza);
            return $this->json($registro, Response::HTTP_OK);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error interno: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // Punto de acceso para marcar una llave como perdida.
    #[Route('/perder', name: 'api_registro_perder', methods: ['POST'])]
    public function perder(Request $request, \App\Repository\RegistroRepository $registroRepository): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);
        
        $idLlave = $datos['llave_id'] ?? null;
        $observaciones = $datos['observaciones'] ?? null;

        if (!$idLlave) {
            return $this->json(['error' => 'Es obligatorio proporcionar la llave.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            // Intentar buscar el registro activo asociado a esta llave (si estuviera prestada)
            $registroActivo = $registroRepository->findRegistroActivoPorLlave($idLlave);
            
            $idUsuarioAccion = $datos['usuario_id'] ?? null;

            if ($registroActivo) {
                // Si la llave está prestada, usamos el flujo basado en el registro de entrega
                $registroIdCadena = $registroActivo->getId()?->toRfc4122();
                $registro = $this->registroService->marcarComoPerdida($registroIdCadena, $observaciones, $idUsuarioAccion);
            } else {
                // Si la llave NO está prestada (está disponible), usamos el flujo de marcado directo
                $registro = $this->registroService->marcarLlaveComoPerdidaDirectamente($idLlave, $observaciones, $idUsuarioAccion);
            }
            
            return $this->json($registro, Response::HTTP_OK);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error interno: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // Punto de acceso para restaurar una llave perdida.
    #[Route('/restaurar', name: 'api_registro_restaurar', methods: ['POST'])]
    public function restaurar(Request $request): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);
        
        $idLlave = $datos['llave_id'] ?? null;
        $observaciones = $datos['observaciones'] ?? null;

        if (!$idLlave) {
            return $this->json(['error' => 'Es obligatorio proporcionar el ID de la llave.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $idUsuarioAccion = $datos['usuario_id'] ?? null;
            $registro = $this->registroService->restaurarLlave($idLlave, $observaciones, $idUsuarioAccion);
            return $this->json($registro, Response::HTTP_OK);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error interno: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
