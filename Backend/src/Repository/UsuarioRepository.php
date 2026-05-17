<?php

namespace App\Repository;

use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/*
Repositorio de la entidad Usuario.
Gestiona las consultas sobre usuarios del sistema y, opcionalmente,
implementa PasswordUpgraderInterface para actualizar hashes de contraseña
de forma automática cuando Symfony lo solicite.
Extiende ServiceEntityRepository, que ya incluye los métodos básicos
de Doctrine: find(), findAll(), findBy(), findOneBy(), etc.
*/
class UsuarioRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    /*
    Constructor del repositorio.
    Función encargada de registrar la entidad Usuario como entidad gestionada por este repositorio.
    */
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Usuario::class);
    }

    /*
    Función encargada de actualizar automáticamente el hash de contraseña de un usuario
    cuando Symfony detecta que el algoritmo de hash ha cambiado o mejorado.
    Requerido por la interfaz PasswordUpgraderInterface.
    */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof Usuario) {
            throw new UnsupportedUserException(sprintf('Las instancias de "%s" no están soportadas.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    /*
    Función encargada de buscar un usuario por su nombre de usuario (campo 'usuario'), que es único.
    Devuelve null si no existe ningún usuario con ese identificador.
    */
    public function findByUsuario(string $usuario): ?Usuario
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.usuario = :usuario')
            ->setParameter('usuario', $usuario)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /*
    Función encargada de buscar un usuario por su dirección de correo electrónico, que es única.
    Devuelve null si no existe ningún usuario con ese email.
    */
    public function findByEmail(string $email): ?Usuario
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.email = :email')
            ->setParameter('email', $email)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /*
    Función encargada de buscar un usuario por su código de barras, que es único.
    Se utiliza para identificar usuarios mediante lectura de código de barras físico.
    */
    public function findByCodigoBarras(string $codigoBarras): ?Usuario
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.codigoBarras = :cb')
            ->setParameter('cb', $codigoBarras)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /*
    Función encargada de devolver todos los usuarios que tienen un rol concreto,
    ordenados alfabéticamente por nombre.
    */
    public function findByRol(string $rol): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.rol = :rol')
            ->setParameter('rol', $rol)
            ->orderBy('u.nombre', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /*
    Función encargada de devolver todos los usuarios con rol 'administrador',
    ordenados alfabéticamente por nombre.
    */
    public function findAdministradores(): array
    {
        return $this->findByRol(Usuario::ROL_ADMINISTRADOR);
    }

    /*
    Función encargada de devolver todos los usuarios con rol 'ordenanza',
    ordenados alfabéticamente por nombre.
    */
    public function findOrdenanzas(): array
    {
        return $this->findByRol(Usuario::ROL_ORDENANZA);
    }
}