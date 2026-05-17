<?php

namespace App\Repository;

use App\Entity\Registro;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class RegistroRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Registro::class);
    }


    // Devuelve los registros realizados en el día actual
    public function findRegistrosHoy(): array
    {
        $hoy = new \DateTimeImmutable('today');
        $manana = $hoy->modify('+1 day');

        return $this->createQueryBuilder('r')
            ->where('r.fechaHoraEntrega >= :hoy')
            ->andWhere('r.fechaHoraEntrega < :manana')
            ->setParameter('hoy', $hoy)
            ->setParameter('manana', $manana)
            ->orderBy('r.fechaHoraEntrega', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findRegistroActivoPorLlave(string $llaveId): ?Registro
    {
        if (!\Symfony\Component\Uid\Uuid::isValid($llaveId)) {
            return null;
        }

        return $this->createQueryBuilder('r')
            ->andWhere('r.llave = :llaveId')
            ->andWhere('r.tipoAccion = :tipoAccion')
            ->andWhere('r.fechaHoraDevolucion IS NULL')
            ->setParameter('llaveId', \Symfony\Component\Uid\Uuid::fromString($llaveId), 'uuid')
            ->setParameter('tipoAccion', 'entrega')
            ->orderBy('r.fechaHoraEntrega', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
}
