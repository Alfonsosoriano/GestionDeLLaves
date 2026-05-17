<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/*
Trait para estandarizar respuestas JSON en toda la API.
Proporciona métodos consistentes para devolver:
- Respuestas exitosas con datos
- Errores de validación
- Errores del servidor
- Respuestas paginadas
Uso en controladores:
return $this->jsonSuccess(['data' => $usuario], Response::HTTP_CREATED);
*/
trait ApiResponseTrait
{
    // Respuesta exitosa con datos.
    protected function jsonSuccess(
        mixed $data = null,
        ?string $message = null,
        int $statusCode = Response::HTTP_OK
    ): JsonResponse {
        $response = [
            'success' => true,
            'code' => $statusCode,
        ];

        if ($message !== null) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        return new JsonResponse($response, $statusCode);
    }

    // Respuesta de error con mensaje descriptivo.
    protected function jsonError(
        string $message,
        int $statusCode = Response::HTTP_BAD_REQUEST,
        mixed $errors = null
    ): JsonResponse {
        $response = [
            'success' => false,
            'code' => $statusCode,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return new JsonResponse($response, $statusCode);
    }

    // Respuesta paginada con colección de datos.
    protected function jsonPaginated(
        array $items,
        int $total,
        int $page = 1,
        int $perPage = 10,
        ?string $message = null
    ): JsonResponse {
        $totalPages = (int)ceil($total / $perPage);

        $response = [
            'success' => true,
            'code' => Response::HTTP_OK,
            'data' => $items,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $totalPages,
                'has_next' => $page < $totalPages,
                'has_previous' => $page > 1,
            ],
        ];

        if ($message !== null) {
            $response['message'] = $message;
        }

        return new JsonResponse($response, Response::HTTP_OK);
    }

    // Respuesta para recurso creado.
    protected function jsonCreated(mixed $data, ?string $message = null): JsonResponse
    {
        return $this->jsonSuccess(
            $data,
            $message ?? 'Recurso creado exitosamente.',
            Response::HTTP_CREATED
        );
    }

    // Respuesta para recurso actualizado.
    protected function jsonUpdated(mixed $data, ?string $message = null): JsonResponse
    {
        return $this->jsonSuccess(
            $data,
            $message ?? 'Recurso actualizado exitosamente.',
            Response::HTTP_OK
        );
    }

    // Respuesta para recurso eliminado.
    protected function jsonDeleted(?string $message = null): JsonResponse
    {
        return $this->jsonSuccess(
            null,
            $message ?? 'Recurso eliminado exitosamente.',
            Response::HTTP_OK
        );
    }

    // Respuesta no autorizado.
    protected function jsonUnauthorized(?string $message = null): JsonResponse
    {
        return $this->jsonError(
            $message ?? 'No está autorizado para acceder a este recurso.',
            Response::HTTP_UNAUTHORIZED
        );
    }

    // Respuesta no encontrado.
    protected function jsonNotFound(string $resourceName = 'Recurso'): JsonResponse
    {
        return $this->jsonError(
            "$resourceName no encontrado.",
            Response::HTTP_NOT_FOUND
        );
    }

    // Respuesta validación fallida.
    protected function jsonValidationError(array $errors): JsonResponse
    {
        return $this->jsonError(
            'La validación de datos ha fallado.',
            Response::HTTP_UNPROCESSABLE_ENTITY,
            $errors
        );
    }

    // Respuesta error interno del servidor.
    protected function jsonServerError(?string $message = null): JsonResponse
    {
        return $this->jsonError(
            $message ?? 'Error interno del servidor.',
            Response::HTTP_INTERNAL_SERVER_ERROR
        );
    }
}
