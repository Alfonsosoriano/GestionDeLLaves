<?php

namespace App\Service;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactoryInterface;

class UsuarioService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private PasswordHasherFactoryInterface $passwordHasherFactory
    ) {}

    public function obtenerTodos(): array
    {
        $usuarios = $this->usuarioRepository->findBy(['activo' => true]);
        return array_map([$this, 'aArray'], $usuarios);
    }

    public function aArray(Usuario $usuario): array
    {
        try {
            return [
                'id' => $usuario->getId()?->toRfc4122(),
                'nombre' => $usuario->getNombre() ?? '',
                'usuario' => $usuario->getUsuario() ?? '',
                'email' => $usuario->getEmail() ?? '',
                'rol' => $usuario->getRol() ?? 'ordenanza',
                'codigoBarras' => $usuario->getCodigoBarras() ?? '',
                'preguntaSeguridad' => $usuario->getPreguntaSeguridad()
            ];
        } catch (\Exception $e) {
            error_log("Error al serializar usuario: " . $e->getMessage());
            return [
                'id' => null,
                'nombre' => 'Usuario Corrupto',
                'error' => $e->getMessage()
            ];
        }
    }

    public function obtenerPorId(string $id): ?Usuario
    {
        return $this->usuarioRepository->find($id);
    }

    public function buscarPorNombreUsuario(string $usuario): ?Usuario
    {
        return $this->usuarioRepository->findOneBy(['usuario' => $usuario, 'activo' => true]);
    }

    public function crearUsuario(array $datos): Usuario
    {
        $this->validarDatosObligatorios($datos);

        if ($this->usuarioRepository->findOneBy(['usuario' => $datos['usuario']])) {
            throw new \InvalidArgumentException('El nombre de usuario ya existe.');
        }

        if ($this->usuarioRepository->findOneBy(['email' => $datos['email']])) {
            throw new \InvalidArgumentException('Este email ya está registrado en el sistema.');
        }

        $usuario = new Usuario();
        $usuario->setNombre(trim($datos['nombre']));
        $usuario->setUsuario(trim($datos['usuario']));
        $usuario->setEmail(trim($datos['email']));
        $usuario->setCodigoBarras(trim($datos['codigoBarras']));
        $usuario->setRol($datos['rol'] ?? Usuario::ROL_ORDENANZA);

        if (isset($datos['preguntaSeguridad'])) {
            $usuario->setPreguntaSeguridad($datos['preguntaSeguridad']);
        }
        if (!empty(trim($datos['respuestaSeguridad'] ?? ''))) {
            $this->establecerRespuestaSeguridad($usuario, $datos['respuestaSeguridad']);
        }

        $this->establecerContrasena($usuario, $datos['password']);

        $this->entityManager->persist($usuario);
        $this->entityManager->flush();

        return $usuario;
    }

    public function actualizarUsuario(Usuario $usuario, array $datos): Usuario
    {
        if (isset($datos['nombre'])) {
            $usuario->setNombre(trim($datos['nombre']));
        }
        if (isset($datos['usuario'])) {
            $usuario->setUsuario(trim($datos['usuario']));
        }
        if (isset($datos['email'])) {
            $nuevoEmail = trim($datos['email']);
            // Verificar si el email ya existe en OTRO usuario
            $usuarioExistente = $this->usuarioRepository->findOneBy(['email' => $nuevoEmail]);
            if ($usuarioExistente && $usuarioExistente->getId() !== $usuario->getId()) {
                throw new \InvalidArgumentException('Este email ya está registrado por otro usuario.');
            }
            $usuario->setEmail($nuevoEmail);
        }
        if (isset($datos['codigoBarras'])) {
            $usuario->setCodigoBarras(trim($datos['codigoBarras']));
        }
        if (isset($datos['rol'])) {
            $usuario->setRol($datos['rol']);
        }
        if (isset($datos['preguntaSeguridad'])) {
            $usuario->setPreguntaSeguridad($datos['preguntaSeguridad']);
        }
        if (!empty(trim($datos['respuestaSeguridad'] ?? ''))) {
            $this->establecerRespuestaSeguridad($usuario, $datos['respuestaSeguridad']);
        }

        if (!empty(trim($datos['newPassword'] ?? ''))) {
            $contrasenaActual = $datos['currentPassword'] ?? '';
            if (!$this->verificarContrasena($usuario, $contrasenaActual)) {
                throw new \InvalidArgumentException('La contraseña actual es incorrecta.');
            }
            if ($this->verificarContrasena($usuario, $datos['newPassword'])) {
                throw new \InvalidArgumentException('No se puede utilizar la contraseña porque ya está en uso.');
            }
            $this->establecerContrasena($usuario, $datos['newPassword']);
        } elseif (!empty(trim($datos['password'] ?? ''))) {
            // Este fallback es para la edición administrativa
            if ($this->verificarContrasena($usuario, $datos['password'])) {
                throw new \InvalidArgumentException('No se puede utilizar la contraseña porque ya está en uso.');
            }
            $this->establecerContrasena($usuario, $datos['password']);
        }

        $this->entityManager->flush();

        return $usuario;
    }

    public function eliminarUsuario(Usuario $usuario): void
    {
        $usuario->setActivo(false);
        $this->entityManager->flush();
    }

    private function validarDatosObligatorios(array $datos): void
    {
        if (empty(trim($datos['nombre'] ?? ''))) {
            throw new \InvalidArgumentException('El nombre es obligatorio.');
        }

        if (empty(trim($datos['usuario'] ?? ''))) {
            throw new \InvalidArgumentException('El nombre de usuario es obligatorio.');
        }

        if (empty(trim($datos['email'] ?? ''))) {
            throw new \InvalidArgumentException('El email es obligatorio.');
        }

        if (empty(trim($datos['codigoBarras'] ?? ''))) {
            throw new \InvalidArgumentException('El código de barras es obligatorio.');
        }

        if (empty(trim($datos['password'] ?? ''))) {
            throw new \InvalidArgumentException('La contraseña es obligatoria.');
        }
    }

    public function establecerContrasena(Usuario $usuario, string $contrasena): Usuario
    {
        $contrasenaHasheada = $this->passwordHasher->hashPassword($usuario, $contrasena);
        $usuario->setPassword($contrasenaHasheada);

        return $usuario;
    }
    public function verificarContrasena(Usuario $usuario, string $contrasena): bool
    {
        return $this->passwordHasher->isPasswordValid($usuario, $contrasena);
    }

    public function establecerRespuestaSeguridad(Usuario $usuario, string $respuesta): Usuario
    {
        // Normalizamos la respuesta: minúsculas y sin espacios extra
        $respuestaNormalizada = mb_strtolower(trim($respuesta), 'UTF-8');
        // Usamos el password hasher para la respuesta por seguridad
        $hashedRespuesta = $this->passwordHasher->hashPassword($usuario, $respuestaNormalizada);
        $usuario->setRespuestaSeguridad($hashedRespuesta);

        return $usuario;
    }

    public function verificarRespuestaSeguridad(Usuario $usuario, string $respuesta): bool
    {
        if (!$usuario->getRespuestaSeguridad()) {
            error_log("verificarRespuestaSeguridad: usuario no tiene respuesta configurada.");
            return false;
        }
        
        $respuestaNormalizada = mb_strtolower(trim($respuesta), 'UTF-8');
        $hasher = $this->passwordHasherFactory->getPasswordHasher($usuario);
        
        $isValid = $hasher->verify($usuario->getRespuestaSeguridad(), $respuestaNormalizada);
        
        error_log("verificarRespuestaSeguridad: validando para '{$usuario->getUsuario()}' - Respuesta normalizada: '{$respuestaNormalizada}' - Hash en BD: '{$usuario->getRespuestaSeguridad()}' - Resultado: " . ($isValid ? 'true' : 'false'));
        
        return $isValid;
    }
}
