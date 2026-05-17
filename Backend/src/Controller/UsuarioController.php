<?php

namespace App\Controller;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use OpenApi\Attributes as OA;

/*
Controlador CRUD para la gestión de usuarios del sistema.
Permite listar, crear, actualizar y eliminar usuarios.
Las contraseñas se almacenan siempre hasheadas mediante
el servicio UserPasswordHasherInterface de Symfony.
*/
#[OA\Tag(name: 'Usuarios', description: 'Endpoints para la gestión de usuarios del sistema')]
#[Route('/api/usuarios')]
class UsuarioController extends AbstractController
{
    // Función se encarga de inyectar los servicios necesarios para gestionar usuarios.
    public function __construct(
        private UsuarioRepository            $usuarioRepository,
        private EntityManagerInterface       $entityManager,
        private SerializerInterface          $serializer,
        private UserPasswordHasherInterface  $passwordHasher,
        private ValidatorInterface           $validator
    ) {}

    // Función que devuelve la lista completa de todos los usuarios registrados en el sistema.
    #[OA\Get(
        path: '/api/usuarios',
        summary: 'Listar todos los usuarios',
        description: 'Devuelve un array con todos los usuarios del sistema.',
        tags: ['Usuarios'],
        responses: [
            new OA\Response(response: 200, description: 'Lista de usuarios obtenida correctamente', content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Usuario'))),
        ]
    )]
    #[Route('/login', name: 'usuario_login', methods: ['POST'])]
    public function login(Request $request, \App\Service\UsuarioService $usuarioService, JWTTokenManagerInterface $JWTManager): JsonResponse
    {
        $contenido = $request->getContent();
        error_log("Intento de acceso (cuerpo completo): " . $contenido);
        $datos = json_decode($contenido, true);
        $nombreUsuario = $datos['usuario'] ?? '';
        $contrasena = $datos['password'] ?? '';

        error_log("Intento de acceso: usuario=$nombreUsuario");

        $usuario = $usuarioService->buscarPorNombreUsuario($nombreUsuario);

        if (!$usuario) {
            return new JsonResponse(['error' => 'Usuario no encontrado'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$usuarioService->verificarContrasena($usuario, $contrasena)) {
            return new JsonResponse(['error' => 'Contraseña incorrecta'], Response::HTTP_UNAUTHORIZED);
        }
        
        $token = $JWTManager->create($usuario);
        $datosUsuario = $usuarioService->aArray($usuario);
        $datosUsuario['token'] = $token;
        
        return new JsonResponse($datosUsuario, Response::HTTP_OK);
    }

    #[Route('', name: 'usuario_indice', methods: ['GET'])]
    public function indice(\App\Service\UsuarioService $usuarioService): JsonResponse
    {
        $usuarios = $usuarioService->obtenerTodos();
        return new JsonResponse($usuarios, Response::HTTP_OK);
    }

    // Función que devuelve los datos de un usuario concreto identificado por su UUID.
    #[OA\Get(
        path: '/api/usuarios/{id}',
        summary: 'Obtener un usuario por ID',
        description: 'Devuelve los datos de un usuario específico.',
        tags: ['Usuarios'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'UUID del usuario', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Usuario encontrado',    content: new OA\JsonContent(ref: '#/components/schemas/Usuario')),
            new OA\Response(response: 404, description: 'Usuario no encontrado'),
        ]
    )]
    #[Route('/{id}', name: 'usuario_mostrar', methods: ['GET'])]
    public function mostrar(Usuario $usuario, \App\Service\UsuarioService $usuarioService): JsonResponse
    {
        return new JsonResponse($usuarioService->aArray($usuario), Response::HTTP_OK);
    }

    /*
    Función que se encarga de crear un nuevo usuario en el sistema.
    Los campos nombre, usuario, codigoBarras y password son obligatorios.
    La contraseña se hashea automáticamente antes de persistirla.
    */
    #[OA\Post(
        path: '/api/usuarios',
        summary: 'Crear un nuevo usuario',
        description: 'Registra un nuevo usuario en el sistema. La contraseña se almacena hasheada.',
        tags: ['Usuarios'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['nombre', 'usuario', 'codigoBarras', 'password', 'email'],
                properties: [
                    new OA\Property(property: 'nombre',       type: 'string', description: 'Nombre completo del usuario'),
                    new OA\Property(property: 'usuario',      type: 'string', description: 'Nombre de usuario para el login'),
                    new OA\Property(property: 'email',        type: 'string', format: 'email', description: 'Correo electrónico del usuario'),
                    new OA\Property(property: 'codigoBarras', type: 'string', description: 'Código de barras único del usuario'),
                    new OA\Property(property: 'password',     type: 'string', format: 'password', description: 'Contraseña en texto plano (se hashea internamente)'),
                    new OA\Property(property: 'rol',          type: 'string', enum: ['administrador', 'ordenanza'], description: 'Rol del usuario (por defecto: ordenanza)'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Usuario creado correctamente',          content: new OA\JsonContent(ref: '#/components/schemas/Usuario')),
            new OA\Response(response: 400, description: 'Datos inválidos o campos obligatorios faltantes'),
        ]
    )]
    #[Route('', name: 'usuario_crear', methods: ['POST'])]
    public function crear(Request $request, \App\Service\UsuarioService $usuarioService): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);

        try {
            $usuario = $usuarioService->crearUsuario($datos);
            return new JsonResponse($usuarioService->aArray($usuario), Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Error interno del servidor'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /*
    Función que actualiza los datos de un usuario existente identificado por su UUID.
    Solo se actualizan los campos presentes en el cuerpo de la petición.
    Si se envía password no vacía, se hashea y actualiza.
    */
    #[OA\Put(
        path: '/api/usuarios/{id}',
        summary: 'Actualizar un usuario',
        description: 'Modifica los datos de un usuario existente. Solo se actualizan los campos enviados.',
        tags: ['Usuarios'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'UUID del usuario a actualizar', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'nombre',       type: 'string'),
                    new OA\Property(property: 'usuario',      type: 'string'),
                    new OA\Property(property: 'codigoBarras', type: 'string'),
                    new OA\Property(property: 'rol',          type: 'string', enum: ['administrador', 'ordenanza']),
                    new OA\Property(property: 'password',     type: 'string', format: 'password', description: 'Nueva contraseña (dejar vacío para no cambiarla)'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Usuario actualizado correctamente', content: new OA\JsonContent(ref: '#/components/schemas/Usuario')),
            new OA\Response(response: 400, description: 'Datos inválidos'),
            new OA\Response(response: 404, description: 'Usuario no encontrado'),
        ]
    )]
    #[Route('/{id}', name: 'usuario_actualizar', methods: ['PUT'])]
    public function actualizar(Request $request, Usuario $usuario, \App\Service\UsuarioService $usuarioService): JsonResponse
    {
        $datos = json_decode($request->getContent(), true);

        try {
            $usuario = $usuarioService->actualizarUsuario($usuario, $datos);
            return new JsonResponse($usuarioService->aArray($usuario), Response::HTTP_OK);
        } catch (\InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    // Función que se encarga de eliminar permanentemente un usuario del sistema identificado por su UUID.
    #[OA\Delete(
        path: '/api/usuarios/{id}',
        summary: 'Eliminar un usuario',
        description: 'Elimina de forma permanente el usuario indicado del sistema.',
        tags: ['Usuarios'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'UUID del usuario a eliminar', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Usuario eliminado correctamente'),
            new OA\Response(response: 404, description: 'Usuario no encontrado'),
        ]
    )]
    #[Route('/{id}', name: 'usuario_eliminar', methods: ['DELETE'])]
    public function eliminar(Usuario $usuario, \App\Service\UsuarioService $usuarioService): JsonResponse
    {
        $usuarioService->eliminarUsuario($usuario);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}