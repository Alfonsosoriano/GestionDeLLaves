<?php

namespace App\Service;

use App\Entity\Llave;
use App\Repository\LlaveRepository;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;
use Symfony\Component\Uid\Uuid;

class LlaveService
{
    private LlaveRepository $llaveRepository;
    private EntityManagerInterface $em;

    public function __construct(LlaveRepository $llaveRepository, EntityManagerInterface $em)
    {
        $this->llaveRepository = $llaveRepository;
        $this->em = $em;
    }

    /*
    Convierte una entidad Llave a un array asociativo.
    Esto evita problemas de referencia circular al devolver JSON en la API.
    */
    public function aArray(Llave $llave): array
    {
        try {
            return [
                'id' => $llave->getId()?->toRfc4122(),
                'codigo_barras' => $llave->getCodigoBarras() ?? '',
                'descripcion' => $llave->getDescripcion() ?? '',
                'estado' => $llave->getEstado() ?? 'disponible',
                'fecha_creacion' => $llave->getFechaCreacion()->format('c'),
            ];
        } catch (\Exception $e) {
            error_log("Error al serializar llave: " . $e->getMessage());
            return [
                'id' => null,
                'descripcion' => 'Llave Corrupta',
                'error' => $e->getMessage()
            ];
        }
    }

    public function obtenerTodasLasLlaves(): array
    {
        $llaves = $this->llaveRepository->findBy(['activo' => true]);
        return array_map([$this, 'aArray'], $llaves);
    }

    public function obtenerLlavePorId(string $id): ?array
    {
        if (!Uuid::isValid($id)) {
            throw new InvalidArgumentException("Formato de ID inválido.");
        }

        $llave = $this->llaveRepository->find($id);
        if (!$llave) {
            return null;
        }

        return $this->aArray($llave);
    }

    public function buscarLlaves(string $busqueda): array
    {
        $consulta = $this->em->createQueryBuilder();
        $consulta->select('l')
           ->from(Llave::class, 'l')
           ->where('l.activo = true')
           ->andWhere('(l.codigoBarras LIKE :busqueda OR l.descripcion LIKE :busqueda OR l.estado LIKE :busqueda)')
           ->setParameter('busqueda', '%' . $busqueda . '%');

        $llaves = $consulta->getQuery()->getResult();
        return array_map([$this, 'aArray'], $llaves);
    }

    public function crearLlave(array $datos): array
    {
        if (empty($datos['codigo_barras']) || empty($datos['descripcion'])) {
            throw new InvalidArgumentException("El código de barras y la descripción son obligatorios.");
        }

        // Validación: Evitar duplicar códigos de barras
        $existente = $this->llaveRepository->findByCodigoBarras($datos['codigo_barras']);
        if ($existente) {
            throw new InvalidArgumentException("El código de barras ya existe en el sistema.");
        }

        // Validación: Evitar duplicar descripciones (nombres) de llaves activas
        $descripcionLimpia = trim($datos['descripcion']);
        $existenteDesc = $this->llaveRepository->findOneBy([
            'descripcion' => $descripcionLimpia,
            'activo' => true
        ]);
        if ($existenteDesc) {
            throw new InvalidArgumentException("Ya existe una llave activa con esa misma descripción.");
        }

        $llave = new Llave();
        $llave->setCodigoBarras($datos['codigo_barras']);
        $llave->setDescripcion($descripcionLimpia);

        if (isset($datos['estado'])) {
            $llave->setEstado($datos['estado']);
        }

        $this->em->persist($llave);
        $this->em->flush();

        return $this->aArray($llave);
    }

    public function actualizarLlave(string $id, array $datos): array
    {
        if (!Uuid::isValid($id)) {
            throw new InvalidArgumentException("Formato de ID inválido.");
        }

        $llave = $this->llaveRepository->find($id);
        if (!$llave) {
            throw new InvalidArgumentException("La llave no existe.", 404);
        }

        if (isset($datos['codigo_barras'])) {
            $existente = $this->llaveRepository->findByCodigoBarras($datos['codigo_barras']);
            if ($existente && $existente->getId() !== $llave->getId()) {
                throw new InvalidArgumentException("El código de barras ya está siendo usado por otra llave.");
            }
            $llave->setCodigoBarras($datos['codigo_barras']);
        }

        if (isset($datos['descripcion'])) {
            $descripcionLimpia = trim($datos['descripcion']);
            $existenteDesc = $this->llaveRepository->findOneBy([
                'descripcion' => $descripcionLimpia,
                'activo' => true
            ]);
            if ($existenteDesc && $existenteDesc->getId()?->toRfc4122() !== $llave->getId()?->toRfc4122()) {
                throw new InvalidArgumentException("La descripción ya está siendo usada por otra llave activa.");
            }
            $llave->setDescripcion($descripcionLimpia);
        }

        if (isset($datos['estado'])) {
            $llave->setEstado($datos['estado']);
        }

        $this->em->flush();

        return $this->aArray($llave);
    }

    public function eliminarLlave(string $id): void
    {
        if (!Uuid::isValid($id)) {
            throw new InvalidArgumentException("Formato de ID inválido.");
        }

        $llave = $this->llaveRepository->find($id);
        if (!$llave) {
            throw new InvalidArgumentException("La llave no existe.", 404);
        }

        // Ya no eliminamos los registros asociados para mantener el historial
        $llave->setActivo(false);
        $this->em->flush();
    }
}
