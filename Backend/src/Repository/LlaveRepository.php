<?php

namespace App\Repository;

use App\Entity\Llave;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/*
Repositorio de la entidad Llave.
Proporciona métodos de consulta personalizados para buscar llaves
por estado y código de barras.
Extiende ServiceEntityRepository, que ya incluye los métodos básicos
de Doctrine: find(), findAll(), findBy(), findOneBy(), etc.
*/
class LlaveRepository extends ServiceEntityRepository
{
    /*
    Constructor del repositorio.
    Función encargada de registrar la entidad Llave como entidad gestionada por este repositorio.
    */
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Llave::class);
    }

    /*
    Función encargada de devolver todas las llaves que tienen un estado concreto,
    ordenadas alfabéticamente por código de barras.
    */
    public function findByEstado(string $estado): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.estado = :estado')
            ->setParameter('estado', $estado)
            ->orderBy('l.codigoBarras', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /*
    Función encargada de devolver todas las llaves cuyo estado es 'disponible',
    es decir, que pueden ser prestadas en este momento.
    */
    public function findDisponibles(): array
    {
        return $this->findByEstado(Llave::ESTADO_DISPONIBLE);
    }

    /*
    Función encargada de devolver todas las llaves cuyo estado es 'prestada',
    es decir, que están actualmente en posesión de algún usuario.
    */
    public function findPrestadas(): array
    {
        return $this->findByEstado(Llave::ESTADO_PRESTADA);
    }

    /*
    Función encargada de devolver todas las llaves cuyo estado es 'perdida',
    es decir, que han sido reportadas como no recuperables.
    */
    public function findPerdidas(): array
    {
        return $this->findByEstado(Llave::ESTADO_PERDIDA);
    }

    /*
    Función encargada de buscar y devolver una llave cuyo código de barras coincida exactamente
    con el valor indicado. Devuelve null si no existe ninguna coincidencia.
    */
    public function findByCodigoBarras(string $codigoBarras): ?Llave
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.codigoBarras = :cb')
            ->setParameter('cb', $codigoBarras)
            ->getQuery()
            ->getOneOrNullResult();
    }
}