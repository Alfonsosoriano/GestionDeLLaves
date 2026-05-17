<?php

namespace App\Entity;

use App\Repository\RegistroRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: RegistroRepository::class)]
#[ORM\Table(name: 'registros')]
class Registro
{

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(inversedBy: 'registros')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Llave $llave = null;

    #[ORM\ManyToOne(inversedBy: 'registros')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Usuario $usuario = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Usuario $usuarioDevolucion = null;

    #[ORM\Column(length: 255)]
    private ?string $nombreUsuario = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $fechaHoraEntrega = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $fechaHoraDevolucion = null;

    #[ORM\Column(length: 50)]
    private ?string $tipoAccion = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $observaciones = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getLlave(): ?Llave
    {
        return $this->llave;
    }

    public function setLlave(?Llave $llave): static
    {
        $this->llave = $llave;

        return $this;
    }

    public function getUsuario(): ?Usuario
    {
        return $this->usuario;
    }

    public function setUsuario(?Usuario $usuario): static
    {
        $this->usuario = $usuario;

        return $this;
    }

    public function getUsuarioDevolucion(): ?Usuario
    {
        return $this->usuarioDevolucion;
    }

    public function setUsuarioDevolucion(?Usuario $usuarioDevolucion): static
    {
        $this->usuarioDevolucion = $usuarioDevolucion;

        return $this;
    }

    public function getNombreUsuario(): ?string
    {
        return $this->nombreUsuario;
    }

    public function setNombreUsuario(string $nombreUsuario): static
    {
        $this->nombreUsuario = $nombreUsuario;

        return $this;
    }

    public function getFechaHoraEntrega(): ?\DateTimeImmutable
    {
        return $this->fechaHoraEntrega;
    }

    public function setFechaHoraEntrega(\DateTimeImmutable $fechaHoraEntrega): static
    {
        $this->fechaHoraEntrega = $fechaHoraEntrega;

        return $this;
    }

    public function getFechaHoraDevolucion(): ?\DateTimeImmutable
    {
        return $this->fechaHoraDevolucion;
    }

    public function setFechaHoraDevolucion(?\DateTimeImmutable $fechaHoraDevolucion): static
    {
        $this->fechaHoraDevolucion = $fechaHoraDevolucion;

        return $this;
    }

    public function getTipoAccion(): ?string
    {
        return $this->tipoAccion;
    }

    public function setTipoAccion(string $tipoAccion): static
    {
        $this->tipoAccion = $tipoAccion;

        return $this;
    }

    public function getObservaciones(): ?string
    {
        return $this->observaciones;
    }

    public function setObservaciones(?string $observaciones): static
    {
        $this->observaciones = $observaciones;

        return $this;
    }
}
