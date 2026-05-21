<?php

namespace App\Controller;

use App\Repository\UsuarioRepository;
use App\Service\UsuarioService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

// Controlador para la recuperación de contraseña mediante pregunta de seguridad.
#[Route('/api/recuperar-contrasena')]
class PasswordResetController extends AbstractController
{
    public function __construct(
        private readonly UsuarioRepository $usuarioRepository,
        private readonly UsuarioService $usuarioService,
        private readonly EntityManagerInterface $entityManager
    ) {}

    // Obtiene la pregunta de seguridad asociada a un nombre de usuario.
    #[Route('/pregunta/{nombreUsuario}', name: 'api_password_reset_pregunta', methods: ['GET'])]
    public function obtenerPregunta(string $nombreUsuario): JsonResponse
    {
        $usuario = $this->usuarioRepository->findOneBy(['usuario' => $nombreUsuario]);

        if (!$usuario) {
            return $this->json(['error' => 'El usuario no existe.'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->getPreguntaSeguridad()) {
            return $this->json([
                'error' => 'Este usuario no tiene configurada una pregunta de seguridad. Contacte con un administrador.'
            ], Response::HTTP_BAD_REQUEST);
        }

        return $this->json([
            'pregunta' => $usuario->getPreguntaSeguridad()
        ]);
    }

    // Verifica la respuesta a la pregunta de seguridad y cambia la contraseña.
    #[Route('/verificar', name: 'api_password_reset_verificar', methods: ['POST'])]
    public function verificar(Request $request): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);

        if (!is_array($datos)) {
            return $this->json(['error' => 'Datos de solicitud inválidos.'], Response::HTTP_BAD_REQUEST);
        }

        $nombreUsuario = $datos['usuario'] ?? null;
        $respuesta = $datos['respuesta'] ?? $datos['response'] ?? null;
        $nuevaPassword = $datos['nuevaPassword'] ?? null;

        if (!$nombreUsuario || !$respuesta || !$nuevaPassword) {
            return $this->json(['error' => 'Faltan datos obligatorios.'], Response::HTTP_BAD_REQUEST);
        }

        $usuario = $this->usuarioRepository->findOneBy(['usuario' => $nombreUsuario]);

        if (!$usuario) {
            return $this->json(['error' => 'El usuario no existe.'], Response::HTTP_NOT_FOUND);
        }

        // Verificar la respuesta
        if (!$this->usuarioService->verificarRespuestaSeguridad($usuario, $respuesta)) {
            return $this->json(['error' => 'La respuesta a la pregunta de seguridad es incorrecta.'], Response::HTTP_BAD_REQUEST);
        }

        // Si la respuesta es correcta, cambiamos la contraseña
        try {
            $this->usuarioService->establecerContrasena($usuario, $nuevaPassword);
            $this->entityManager->flush();

            return $this->json(['mensaje' => 'Contraseña actualizada correctamente.'], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al actualizar la contraseña.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
