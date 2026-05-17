<?php

namespace App\Entity;

use App\Repository\UsuarioRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use App\Entity\Registro;
use Symfony\Component\Serializer\Annotation\Ignore;
use Symfony\Component\Validator\Constraints as Assert;
use OpenApi\Attributes as OA; //importante instalar composer require zircote/swagger-php:^4.0 

/*
Entidad que representa a un usuario del sistema.
Implementa las interfaces de Symfony Security para gestionar
autenticación y autorización. Cada usuario tiene un rol
(administrador u ordenanza) y puede estar asociado a múltiples
registros de entrega O devolución de llaves.
*/
#[OA\Schema(
    schema: 'Usuario',
    description: 'Entidad que representa a un usuario del sistema de gestión de llaves',
    properties: [
        new OA\Property(property: 'id',           type: 'string', format: 'uuid',  description: 'Identificador único UUID del usuario'),
        new OA\Property(property: 'nombre',       type: 'string',                  description: 'Nombre completo del usuario'),
        new OA\Property(property: 'usuario',      type: 'string',                  description: 'Nombre de usuario único para el login'),
        new OA\Property(property: 'email',        type: 'string', format: 'email', description: 'Correo electrónico único del usuario'),
        new OA\Property(property: 'codigoBarras', type: 'string',                  description: 'Código de barras único asociado al usuario'),
        new OA\Property(property: 'rol',          type: 'string', enum: ['administrador', 'ordenanza'], description: 'Rol del usuario en el sistema'),
    ]
)]
#[ORM\Entity(repositoryClass: UsuarioRepository::class)]
#[ORM\Table(name: 'usuarios')]
#[UniqueEntity('usuario')]
#[UniqueEntity('codigoBarras')]
#[UniqueEntity('email')]
class Usuario implements UserInterface, PasswordAuthenticatedUserInterface
{
    // -Constantes de roles disponibles en el sistema-

    // Rol con acceso completo al sistema
    public const ROL_ADMINISTRADOR = 'administrador';

    // Rol con acceso limitado, solo para la gestión de llaves
    public const ROL_ORDENANZA = 'ordenanza';

   
    // -Propiedades (Columnas) de base de datos-

    // Identificador único UUID generado automáticamente
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    // Nombre completo del usuario
    #[ORM\Column(type: 'string', length: 255)]
    private string $nombre;

    // Nombre de usuario único utilizado para el login
    #[ORM\Column(type: 'string', length: 180, unique: true)]
    private string $usuario;

    // Correo electrónico único del usuario
    #[ORM\Column(length: 180, unique: true)]
    private string $email;

    // Contraseña hasheada del usuario
    #[ORM\Column(type: 'string')]
    private string $password;

    // Código de barras único asociado al usuario para identificación física
    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $codigoBarras;

    // Rol del usuario dentro del sistema (administrador u ordenanza)
    #[ORM\Column(type: 'string', length: 50)]
    private string $rol;

    // Pregunta de seguridad elegida por el usuario
    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $preguntaSeguridad = null;

    // Respuesta a la pregunta de seguridad (hasheada)
    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $respuestaSeguridad = null;

    // Colección de registros de entrega/devolución de llaves asociados al usuario
    #[ORM\OneToMany(mappedBy: 'usuario', targetEntity: Registro::class)]
    #[Ignore]
    private Collection $registros;

    // Indica si el usuario está activo o ha sido "borrado" lógicamente
    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $activo = true;

    /*
    CONSTRUCTOR
    Inicializa la colección de registros vacía al crear el usuario.
    */
    public function __construct()
    {
        $this->registros = new ArrayCollection();
    }

    // MÉTODOS

    /*
    Método estático para crear un nuevo usuario con datos básicos.
    La contraseña se establece vacía y debe ser asignada posteriormente mediante setPassword().
    */
    public static function create(
        string $nombre,
        string $usuario,
        string $codigoBarras,
        string $rol = self::ROL_ORDENANZA
    ): self {
        $u = new self();
        $u->nombre       = trim($nombre);
        $u->usuario      = trim($usuario);
        $u->codigoBarras = trim($codigoBarras);
        $u->setRol($rol);
        $u->password     = '';
        return $u;
    }

   
    // GETTERS Y SETTERS

    // Devuelve el identificador único UUID del usuario.
    public function getId(): ?Uuid
    {
        return $this->id;
    }

    // Devuelve el nombre completo del usuario.
    public function getNombre(): string
    {
        return $this->nombre;
    }

    // Establece el nombre completo del usuario.
    public function setNombre(string $nombre): self
    {
        $this->nombre = trim($nombre);
        return $this;
    }

    // Devuelve el nombre de usuario utilizado para el login.
    public function getUsuario(): string
    {
        return $this->usuario;
    }

    // Establece el nombre de usuario para el login.
    public function setUsuario(string $usuario): self
    {
        $this->usuario = trim($usuario);
        return $this;
    }

    // Devuelve el correo electrónico del usuario.
    public function getEmail(): string
    {
        return $this->email;
    }

    // Establece el correo electrónico del usuario.
    public function setEmail(string $email): self
    {
        $this->email = trim($email);
        return $this;
    }

    // Devuelve el código de barras único del usuario.
    public function getCodigoBarras(): string
    {
        return $this->codigoBarras;
    }

    // Establece el código de barras del usuario.
    public function setCodigoBarras(string $codigoBarras): self
    {
        $this->codigoBarras = trim($codigoBarras);
        return $this;
    }

    // Devuelve el rol del usuario en el sistema.
    public function getRol(): string
    {
        return $this->rol;
    }

    // Establece el rol del usuario, validando que sea un rol permitido.
    public function setRol(string $rol): self
    {
        if (!in_array($rol, [self::ROL_ADMINISTRADOR, self::ROL_ORDENANZA], true)) {
            throw new \InvalidArgumentException("Rol inválido: $rol");
        }

        $this->rol = $rol;
        return $this;
    }

    // Devuelve la pregunta de seguridad del usuario.
    public function getPreguntaSeguridad(): ?string
    {
        return $this->preguntaSeguridad;
    }

    // Establece la pregunta de seguridad del usuario.
    public function setPreguntaSeguridad(?string $preguntaSeguridad): self
    {
        $this->preguntaSeguridad = $preguntaSeguridad ? trim($preguntaSeguridad) : null;
        return $this;
    }

    // Devuelve la respuesta hasheada a la pregunta de seguridad.
    public function getRespuestaSeguridad(): ?string
    {
        return $this->respuestaSeguridad;
    }

    // Establece la respuesta hasheada a la pregunta de seguridad.
    public function setRespuestaSeguridad(?string $respuestaSeguridad): self
    {
        $this->respuestaSeguridad = $respuestaSeguridad;
        return $this;
    }

    // Devuelve la colección de registros asociados al usuario.
    public function getRegistros(): Collection
    {
        return $this->registros;
    }

    /*
    Añade un registro a la colección del usuario si no estaba ya incluido,
    y establece la relación bidireccional.
    */
    public function addRegistro(Registro $registro): self
    {
        if (!$this->registros->contains($registro)) {
            $this->registros->add($registro);
            $registro->setUsuario($this);
        }
        return $this;
    }

    /*
    Elimina un registro de la colección del usuario y rompe
    la relación bidireccional si corresponde.
    */
    public function removeRegistro(Registro $registro): self
    {
        if ($this->registros->removeElement($registro)) {
            if ($registro->getUsuario() === $this) {
                $registro->setUsuario(null);
            }
        }
        return $this;
    }

    // Métodos de la interfaz UserInterface (Symfony Security)

    /*
    Devuelve los roles de Symfony Security del usuario.
    Todo usuario tiene al menos ROLE_USER. Los administradores tienen además ROLE_ADMIN.
    */
    public function getRoles(): array
    {
        $roles = ['ROLE_USER'];

        if ($this->rol === self::ROL_ADMINISTRADOR) {
            $roles[] = 'ROLE_ADMIN';
        }

        return $roles;
    }

    // Devuelve la contraseña hasheada del usuario (requerido por PasswordAuthenticatedUserInterface).
    public function getPassword(): string
    {
        return $this->password;
    }

    // Establece la contraseña ya hasheada del usuario.
    public function setPassword(string $hashedPassword): self
    {
        $this->password = $hashedPassword;
        return $this;
    }

    /*
    Devuelve el identificador único del usuario para Symfony Security.
    En este caso se utiliza el nombre de usuario (campo 'usuario').
    */
    public function getUserIdentifier(): string
    {
        return $this->usuario;
    }

    /*
    Limpia credenciales sensibles temporales del usuario.
    Requerido por UserInterface; en este sistema no se almacenan credenciales en texto plano.
    */
    public function eraseCredentials(): void
    {
    }


    // Representación legible del usuario en formato "Nombre (usuario)".
    public function __toString(): string
    {
        return sprintf('%s (%s)', $this->nombre ?? '', $this->usuario ?? '');
    }

    public function isActivo(): bool
    {
        return $this->activo;
    }

    public function setActivo(bool $activo): self
    {
        $this->activo = $activo;
        return $this;
    }
}