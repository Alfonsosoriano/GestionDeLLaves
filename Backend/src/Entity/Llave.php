<?php

namespace App\Entity;

use App\Repository\LlaveRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Entidad que representa una llave física en el sistema.
 *
 * Gestiona:
 * - Llaves originales
 * - Copias de seguridad
 * - Estados (disponible, prestada, perdida)
 * - Código de barras único
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
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

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

    /**
     * Relación con la llave original (para controlar copias)
     * Si es null, significa que esta es una llave original
     * Si tiene valor, esta llave es una copia de otra
     */
    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'copias')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Llave $llaveOriginal = null;

    /**
     * Colección de copias de esta llave
     * Solo se utiliza si esta llave es original
     */
    #[ORM\OneToMany(mappedBy: 'llaveOriginal', targetEntity: self::class, cascade: ['persist'])]
    private Collection $copias;

    /**
     * Fecha de creación del registro
     */
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $fechaCreacion;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->copias = new ArrayCollection();
        $this->fechaCreacion = new \DateTimeImmutable();
    }

    // Getters y Setters -->

    public function getId(): ?int
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

    public function getLlaveOriginal(): ?self
    {
        return $this->llaveOriginal;
    }

    public function setLlaveOriginal(?self $llaveOriginal): self
    {
        $this->llaveOriginal = $llaveOriginal;
        return $this;
    }

    /**
     * Obtiene todas las copias de esta llave
     *
     * @return Collection<int, self>
     */
    public function getCopias(): Collection
    {
        return $this->copias;
    }

    public function addCopia(self $copia): self
    {
        if (!$this->copias->contains($copia)) {
            $this->copias[] = $copia;
            $copia->setLlaveOriginal($this);
        }
        return $this;
    }

    public function removeCopia(self $copia): self
    {
        if ($this->copias->removeElement($copia)) {
            if ($copia->getLlaveOriginal() === $this) {
                $copia->setLlaveOriginal(null);
            }
        }
        return $this;
    }

    public function getFechaCreacion(): \DateTimeImmutable
    {
        return $this->fechaCreacion;
    }

    // Metodos Propios

    /**
     * Comprueba si esta llave es una copia
     */
    public function esUnaCopia(): bool
    {
        return $this->llaveOriginal !== null;
    }

    /**
     * Comprueba si esta llave es original
     */
    public function esOriginal(): bool
    {
        return $this->llaveOriginal === null;
    }

    /**
     * Obtiene la llave original (a sí misma si es original, o su original si es copia)
     */
    public function obtenerLlaveOriginal(): self
    {
        return $this->esOriginal() ? $this : $this->llaveOriginal;
    }

    /**
     * Obtiene el total de copias disponibles (incluyéndose a sí misma si es original)
     */
    public function obtenerTotalCopias(): int
    {
        if ($this->esOriginal()) {
            return 1 + count($this->copias); // La original + sus copias
        }
        return $this->llaveOriginal->obtenerTotalCopias();
    }

    /**
     * Comprueba si la llave está disponible
     */
    public function estaDisponible(): bool
    {
        return $this->estado === self::ESTADO_DISPONIBLE;
    }

    /**
     * Comprueba si la llave está prestada
     */
    public function estaPrestada(): bool
    {
        return $this->estado === self::ESTADO_PRESTADA;
    }

    /**
     * Comprueba si la llave está perdida
     */
    public function estaPerdida(): bool
    {
        return $this->estado === self::ESTADO_PERDIDA;
    }

    /**
     * Convertir datos de llave a string
     */
    public function __toString(): string
    {
        return sprintf('%s - %s (%s)', $this->codigoBarras, $this->descripcion, $this->estado);
    }
}
