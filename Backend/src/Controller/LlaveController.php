<?php

namespace App\Controller;

use App\Service\LlaveService;
use InvalidArgumentException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/llaves', name: 'api_llaves_')]
class LlaveController extends AbstractController
{
    private LlaveService $llaveService;

    public function __construct(LlaveService $llaveService)
    {
        $this->llaveService = $llaveService;
    }

    #[Route('', name: 'obtener_todas', methods: ['GET'])]
    public function obtenerTodas(): JsonResponse
    {
        try {
            $llaves = $this->llaveService->obtenerTodasLasLlaves();
            return $this->json($llaves, Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/buscar', name: 'buscar', methods: ['GET'])]
    public function buscar(Request $request): JsonResponse
    {
        try {
            $busqueda = $request->query->get('q', '');
            if (empty($busqueda)) {
                return $this->json(['error' => 'El parámetro "q" es obligatorio para buscar.'], Response::HTTP_BAD_REQUEST);
            }

            $llaves = $this->llaveService->buscarLlaves($busqueda);
            return $this->json($llaves, Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/comprobar', name: 'api_ping', methods: ['GET'])]
    public function ping(): JsonResponse
    {
        return new JsonResponse(['mensaje' => 'en linea', 'tiempo' => date('Y-m-d H:i:s')], Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'obtener_una', methods: ['GET'])]
    public function obtenerUna(string $id): JsonResponse
    {
        try {
            $llave = $this->llaveService->obtenerLlavePorId($id);
            if (!$llave) {
                return $this->json(['error' => 'Llave no encontrada.'], Response::HTTP_NOT_FOUND);
            }

            return $this->json($llave, Response::HTTP_OK);
        } catch (InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('', name: 'crear', methods: ['POST'])]
    public function crear(Request $request): JsonResponse
    {
        try {
            $datos = json_decode($request->getContent(), true);
            if (!$datos) {
                return $this->json(['error' => 'JSON inválido o vacío.'], Response::HTTP_BAD_REQUEST);
            }

            $llave = $this->llaveService->crearLlave($datos);
            return $this->json($llave, Response::HTTP_CREATED);
        } catch (InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}', name: 'actualizar', methods: ['PUT', 'PATCH'])]
    public function actualizar(string $id, Request $request): JsonResponse
    {
        try {
            $datos = json_decode($request->getContent(), true);
            if (!$datos) {
                return $this->json(['error' => 'JSON inválido o vacío.'], Response::HTTP_BAD_REQUEST);
            }

            $llave = $this->llaveService->actualizarLlave($id, $datos);
            return $this->json($llave, Response::HTTP_OK);
        } catch (InvalidArgumentException $e) {
            $estado = $e->getCode() === 404 ? Response::HTTP_NOT_FOUND : Response::HTTP_BAD_REQUEST;
            return $this->json(['error' => $e->getMessage()], $estado);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}', name: 'eliminar', methods: ['DELETE'])]
    public function eliminar(string $id): JsonResponse
    {
        try {
            $this->llaveService->eliminarLlave($id);
            return $this->json(['message' => 'Llave eliminada correctamente.'], Response::HTTP_OK);
        } catch (InvalidArgumentException $e) {
            $estado = $e->getCode() === 404 ? Response::HTTP_NOT_FOUND : Response::HTTP_BAD_REQUEST;
            return $this->json(['error' => $e->getMessage()], $estado);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
