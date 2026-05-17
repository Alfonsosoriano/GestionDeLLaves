<?php

namespace App\Controller;

use App\Repository\UsuarioRepository;
use App\Repository\LlaveRepository;
use App\Repository\RegistroRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/informes')]
class InformesController extends AbstractController
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
        private LlaveRepository $llaveRepository,
        private RegistroRepository $registroRepository
    ) {}

    // Resumen general del sistema
    #[Route('', name: 'informes_resumen', methods: ['GET'])]
    public function resumen(): JsonResponse
    {
        $totalUsuarios = count($this->usuarioRepository->findAll());
        $totalLlaves = count($this->llaveRepository->findAll());
        $totalRegistros = count($this->registroRepository->findAll());

        $llavesPrestadas = count($this->llaveRepository->findBy(['estado' => 'prestada']));
        $llavesDisponibles = count($this->llaveRepository->findBy(['estado' => 'disponible']));
        $llavesPerdidas = count($this->llaveRepository->findBy(['estado' => 'perdida']));

        return new JsonResponse([
            'usuarios' => $totalUsuarios,
            'llaves' => $totalLlaves,
            'registros' => $totalRegistros,
            'llavesPrestadas' => $llavesPrestadas,
            'llavesDisponibles' => $llavesDisponibles,
            'llavesPerdidas' => $llavesPerdidas,
        ], Response::HTTP_OK);
    }

    // Informe de actividad de usuarios
    #[Route('/usuarios', name: 'informes_usuarios', methods: ['GET'])]
    public function actividadUsuarios(Request $request): JsonResponse
    {
        $usuarios = $this->usuarioRepository->findAll();
        $resultados = [];

        foreach ($usuarios as $usuario) {
            $registros = $this->registroRepository->findBy(['usuario' => $usuario]);
            $entregas = 0;
            $devoluciones = 0;

            foreach ($registros as $registro) {
                if ($registro->getFechaHoraEntrega()) {
                    $entregas++;
                }
                if ($registro->getFechaHoraDevolucion()) {
                    $devoluciones++;
                }
            }

            $resultados[] = [
                'id' => $usuario->getId(),
                'nombre' => $usuario->getNombre(),
                'usuario' => $usuario->getUsuario(),
                'rol' => $usuario->getRol(),
                'entregas' => $entregas,
                'devoluciones' => $devoluciones,
                'pendientes' => $entregas - $devoluciones,
            ];
        }

        return new JsonResponse($resultados, Response::HTTP_OK);
    }

    // Informe de estado de llaves
    #[Route('/llaves', name: 'informes_llaves', methods: ['GET'])]
    public function estadoLlaves(): JsonResponse
    {
        $llaves = $this->llaveRepository->findAll();
        $resultados = [];

        foreach ($llaves as $llave) {
            $registros = $this->registroRepository->findBy(['llave' => $llave]);
            $ultimoRegistro = $registros ? end($registros) : null;


            $resultados[] = [
                'id' => $llave->getId(),
                'codigoBarras' => $llave->getCodigoBarras(),
                'descripcion' => $llave->getDescripcion(),
                'estado' => $llave->getEstado(),
                'ultimaAccion' => $ultimoRegistro ? $ultimoRegistro->getFechaHoraEntrega()->format('c') : null,
                'usuarioActual' => $ultimoRegistro?->getUsuario()?->getNombre() ?? 'Disponible',
            ];
        }

        return new JsonResponse($resultados, Response::HTTP_OK);
    }

    // Informe de llaves prestadas sin devolver
    #[Route('/pendientes', name: 'informes_pendientes', methods: ['GET'])]
    public function llavesPendientes(): JsonResponse
    {
        $llaves = $this->llaveRepository->findBy(['estado' => 'prestada']);
        $resultados = [];

        foreach ($llaves as $llave) {
            $registros = $this->registroRepository->findBy(['llave' => $llave]);
            $ultimoRegistro = $registros ? end($registros) : null;

            if ($ultimoRegistro && !$ultimoRegistro->getFechaHoraDevolucion()) {
                $resultados[] = [
                    'llave' => [
                        'id' => $llave->getId(),
                        'codigoBarras' => $llave->getCodigoBarras(),
                        'descripcion' => $llave->getDescripcion(),
                    ],
                    'usuario' => [
                        'id' => $ultimoRegistro->getUsuario()->getId(),
                        'nombre' => $ultimoRegistro->getUsuario()->getNombre(),
                    ],
                    'fechaEntrega' => $ultimoRegistro->getFechaHoraEntrega()->format('c'),
                    'diasPendiente' => $this->calcularDiasPendiente($ultimoRegistro->getFechaHoraEntrega()),
                ];
            }
        }

        return new JsonResponse($resultados, Response::HTTP_OK);
    }

    #[Route('/llaves-mas-usadas', name: 'informes_llaves_mas_usadas', methods: ['GET'])]
    public function llavesMasUsadas(): JsonResponse
    {
        $registros = $this->registroRepository->findAll();
        $conteoLlaves = [];

        foreach ($registros as $registro) {
            $llaveId = $registro->getLlave()->getId();
            if (!isset($conteoLlaves[$llaveId])) {
                $conteoLlaves[$llaveId] = [
                    'llave' => $registro->getLlave(),
                    'entregas' => 0,
                ];
            }
            $conteoLlaves[$llaveId]['entregas']++;
        }

        // Ordenar por entregas descendente
        usort($conteoLlaves, fn($a, $b) => $b['entregas'] <=> $a['entregas']);

        $resultado = array_map(function ($item) {
            return [
                'id' => $item['llave']->getId(),
                'codigoBarras' => $item['llave']->getCodigoBarras(),
                'descripcion' => $item['llave']->getDescripcion(),
                'entregas' => $item['entregas'],
            ];
        }, array_slice($conteoLlaves, 0, 10)); // Top 10

        return new JsonResponse($resultado, Response::HTTP_OK);
    }

    #[Route('/llaves-perdidas', name: 'informes_llaves_perdidas', methods: ['GET'])]
    public function llavesPerdidas(): JsonResponse
    {
        $llavesPerdidas = $this->llaveRepository->findBy(['estado' => 'perdida']);
        $resultado = [];

        foreach ($llavesPerdidas as $llave) {
            $resultado[] = [
                'id' => $llave->getId(),
                'codigoBarras' => $llave->getCodigoBarras(),
                'descripcion' => $llave->getDescripcion(),
                'estado' => $llave->getEstado(),
            ];
        }

        return new JsonResponse($resultado, Response::HTTP_OK);
    }

    // Informe de actividad en un período
    #[Route('/periodo', name: 'informes_periodo', methods: ['GET'])]
    public function actividadPeriodo(Request $request): JsonResponse
    {
        $desde = $request->query->get('desde');
        $hasta = $request->query->get('hasta');

        if (!$desde || !$hasta) {
            return new JsonResponse(['error' => 'Parámetros desde y hasta requeridos'], Response::HTTP_BAD_REQUEST);
        }

        $desdeDate = new \DateTimeImmutable($desde);
        $hastaDate = new \DateTimeImmutable($hasta);

        $registros = $this->registroRepository->findAll();
        $registrosPeriodo = array_filter($registros, function ($registro) use ($desdeDate, $hastaDate) {
            return $registro->getFechaHoraEntrega() >= $desdeDate && $registro->getFechaHoraEntrega() <= $hastaDate;
        });

        return new JsonResponse([
            'periodo' => ['desde' => $desde, 'hasta' => $hasta],
            'totalMovimientos' => count($registrosPeriodo),
            'registros' => count($registrosPeriodo),
        ], Response::HTTP_OK);
    }

    // Calcular días pendiente
    private function calcularDiasPendiente(\DateTimeImmutable $fecha): int
    {
        $ahora = new \DateTimeImmutable();
        $diff = $ahora->diff($fecha);

        return $diff->days;
    }
}
