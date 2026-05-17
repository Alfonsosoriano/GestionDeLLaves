<?php

namespace App\Entity;

use App\Repository\LlaveRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Uid\Uuid;
use App\Entity\Registro;
use Symfony\Component\Serializer\Annotation\Ignore;


/*
Entidad que representa una llave física en el sistema.
Gestiona:
- Estados (disponible, prestada, perdida)
- Código de barras único
*/
#[ORM\Entity(repositoryClass: LlaveRepository::class)]
#[ORM\Table(name: 'llaves')]
class Llave
{
    // Constantes de estado
    public const ESTADO_DISPONIBLE = 'disponible';
    public const ESTADO_PRESTADA = 'prestada';
    public const ESTADO_PERDIDA = 'perdida';

    // Array de estados válidos
    public const ESTADOS_VALIDOS = [
        self::ESTADO_DISPONIBLE,
        self::ESTADO_PRESTADA,
        self::ESTADO_PERDIDA,
    ];

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(type: 'string', length: 100, unique: true)]
    #[Assert\NotBlank(message: 'El código de barras es obligatorio')]
    #[Assert\Length(
        min: 3,
        max: 100,
        minMessage: 'El código debe tener al menos 3 caracteres',
        maxMessage: 'El código no puede tener mas de 100 caracteres'
    )]
    private string $codigoBarras;

    #[ORM\Column(type: 'string', length: 255)]
    #[Assert\NotBlank(message: 'La descripción es obligatoria')]
    #[Assert\Length(
        min: 5,
        max: 255,
        minMessage: 'La descripción debe tener al menos 5 caracteres',
        maxMessage: 'La descripción no puede exceder 255 caracteres'
    )]
    private string $descripcion;

    #[ORM\Column(type: 'string', length: 20)]
    #[Assert\Choice(
        choices: self::ESTADOS_VALIDOS,
        message: 'El estado debe ser uno de: disponible, prestada o perdida'
    )]
    private string $estado = self::ESTADO_DISPONIBLE;

    // Fecha de creación del registro
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $fechaCreacion;

    #[ORM\OneToMany(targetEntity: Registro::class, mappedBy: 'llave', cascade: ['remove'])]
    #[Ignore]
    private Collection $registros;

    // Indica si la llave está activa o ha sido "borrada" lógicamente
    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $activo = true;

    // Constructor
    public function __construct()
    {
        $this->fechaCreacion = new \DateTimeImmutable();
        $this->registros = new ArrayCollection();
    }

    // Getters y Setters -->

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getCodigoBarras(): string
    {
        return $this->codigoBarras;
    }

    public function setCodigoBarras(string $codigoBarras): self
    {
        $this->codigoBarras = trim($codigoBarras);
        return $this;
    }

    public function getDescripcion(): string
    {
        return $this->descripcion;
    }

    public function setDescripcion(string $descripcion): self
    {
        $this->descripcion = trim($descripcion);
        return $this;
    }

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): self
    {
        if (!in_array($estado, self::ESTADOS_VALIDOS)) {
            throw new \InvalidArgumentException(
                sprintf('Estado inválido: %s. Estados válidos: %s',
                    $estado,
                    implode(', ', self::ESTADOS_VALIDOS)
                )
            );
        }
        $this->estado = $estado;
        return $this;
    }

    public function getFechaCreacion(): \DateTimeImmutable
    {
        return $this->fechaCreacion;
    }

    // Metodos Propios

    // Comprueba si la llave está disponible
    public function estaDisponible(): bool
    {
        return $this->estado === self::ESTADO_DISPONIBLE;
    }

    // Comprueba si la llave está prestada
    public function estaPrestada(): bool
    {
        return $this->estado === self::ESTADO_PRESTADA;
    }

    // Comprueba si la llave está perdida
    public function estaPerdida(): bool
    {
        return $this->estado === self::ESTADO_PERDIDA;
    }

    // Convertir datos de llave a string
    public function __toString(): string
    {
        return sprintf('%s - %s (%s)', $this->codigoBarras, $this->descripcion, $this->estado);
    }

    public function getRegistros(): Collection
    {
        return $this->registros;
    }

    public function addRegistro(Registro $registro): static
    {
        if (!$this->registros->contains($registro)) {
            $this->registros->add($registro);
            $registro->setLlave($this);
        }

        return $this;
    }

    public function removeRegistro(Registro $registro): static
    {
        if ($this->registros->removeElement($registro)) {
            // set the owning side to null (unless already changed)
            if ($registro->getLlave() === $this) {
                $registro->setLlave(null);
            }
        }

        return $this;
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
