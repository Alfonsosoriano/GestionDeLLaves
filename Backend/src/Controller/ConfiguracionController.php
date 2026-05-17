<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/configuracion')]
class ConfiguracionController extends AbstractController
{
    private string $rutaConfig;

    public function __construct()
    {
        // Ruta al archivo JSON en la raíz del proyecto
        $this->rutaConfig = __DIR__ . '/../../config_system.json';
    }

    private function leerConfig(): array
    {
        if (!file_exists($this->rutaConfig)) {
            return [
                'nombre_centro' => 'IES Oretania'
            ];
        }

        $contenido = file_get_contents($this->rutaConfig);
        return json_decode($contenido, true) ?? ['nombre_centro' => 'IES Oretania'];
    }

    private function guardarConfig(array $datos): void
    {
        file_put_contents($this->rutaConfig, json_encode($datos, JSON_PRETTY_PRINT));
    }

    #[Route('', name: 'api_config_get', methods: ['GET'])]
    public function obtenerAjustes(): JsonResponse
    {
        return $this->json($this->leerConfig());
    }

    #[Route('', name: 'api_config_update', methods: ['POST'])]
    public function actualizarAjustes(Request $request): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);
        
        if (!$datos) {
            return $this->json(['error' => 'Datos inválidos'], Response::HTTP_BAD_REQUEST);
        }

        $configActual = $this->leerConfig();
        $nuevaConfig = array_merge($configActual, $datos);
        
        $this->guardarConfig($nuevaConfig);

        return $this->json(['mensaje' => 'Configuración actualizada correctamente']);
    }

    #[Route('/nombre-centro', name: 'api_config_nombre_centro', methods: ['GET'])]
    public function obtenerNombreCentro(): JsonResponse
    {
        $config = $this->leerConfig();
        return $this->json([
            'nombre' => $config['nombre_centro'] ?? 'IES Oretania'
        ]);
    }
}
