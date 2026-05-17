<?php

namespace App\Service;

use App\Entity\Llave;
use App\Entity\Registro;
use App\Repository\LlaveRepository;
use App\Repository\RegistroRepository;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

/*
Servicio encargado de gestionar los registros de entrega,
devolución y pérdida de llaves del sistema.
Usa transacciones Doctrine para garantizar consistencia de datos.
*/
class RegistroService
{
    // Inyecta las dependencias necesarias para gestionar registros.
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UsuarioRepository      $usuarioRepository,
        private readonly LlaveRepository        $llaveRepository,
        private readonly RegistroRepository     $registroRepository
    ) {}

    // Convierte un Registro en un array asociativo para respuesta JSON.
    public function aArray(Registro $registro): array
    {
        return [
            'id'                  => $registro->getId()?->toRfc4122(),
            'llave'               => [
                'id'          => $registro->getLlave()?->getId()?->toRfc4122(),
                'codigoBarras' => $registro->getLlave()?->getCodigoBarras(),
                'descripcion'  => $registro->getLlave()?->getDescripcion(),
                'estado'       => $registro->getLlave()?->getEstado(),
            ],
            'usuario'             => [
                'id'     => $registro->getUsuario()?->getId()?->toRfc4122(),
                'nombre' => $registro->getUsuario()?->getNombre(),
                'email'  => $registro->getUsuario()?->getEmail(),
            ],
            'usuarioDevolucion'   => [
                'id'     => $registro->getUsuarioDevolucion()?->getId()?->toRfc4122(),
                'nombre' => $registro->getUsuarioDevolucion()?->getNombre(),
            ],
            'nombreUsuario'       => $registro->getNombreUsuario(),
            'fechaHoraEntrega'    => $registro->getFechaHoraEntrega()?->format('c'),
            'fechaHoraDevolucion' => $registro->getFechaHoraDevolucion()?->format('c'),
            'tipoAccion'          => $registro->getTipoAccion(),
            'observaciones'       => $registro->getObservaciones(),
        ];
    }

    /*
    Registra la entrega de una llave a un usuario.
    Valida existencia de usuario y llave, y que la llave esté disponible.
    Persiste el registro y actualiza el estado de la llave en una transacción.
    */
    public function entregarLlave(string $idUsuario, string $idLlave, ?string $observaciones = null, ?string $nombrePersona = null): array
    {
        if (!Uuid::isValid($idUsuario)) {
            throw new \InvalidArgumentException('El ID de usuario no tiene un formato UUID válido.');
        }

        if (!Uuid::isValid($idLlave)) {
            throw new \InvalidArgumentException('El ID de llave no tiene un formato UUID válido.');
        }

        $usuario = $this->usuarioRepository->find($idUsuario);
        if (!$usuario) {
            throw new \InvalidArgumentException('El usuario especificado no existe.', 404);
        }

        $llave = $this->llaveRepository->find($idLlave);
        if (!$llave) {
            throw new \InvalidArgumentException('La llave especificada no existe.', 404);
        }

        if (!$llave->estaDisponible()) {
            throw new \InvalidArgumentException(
                sprintf('La llave no está disponible. Estado actual: "%s".', $llave->getEstado())
            );
        }

        $this->em->beginTransaction();

        try {
            $llave->setEstado(Llave::ESTADO_PRESTADA);

            $registro = new Registro();
            $registro->setLlave($llave);
            $registro->setUsuario($usuario);
            $registro->setNombreUsuario($nombrePersona ?: $usuario->getNombre());
            $registro->setFechaHoraEntrega(new \DateTimeImmutable());
            $registro->setTipoAccion('entrega');
            $registro->setObservaciones($observaciones);

            $this->em->persist($registro);
            $this->em->flush();
            $this->em->commit();

            return $this->aArray($registro);

        } catch (\Exception $e) {
            $this->em->rollback();
            throw new \RuntimeException('Error al registrar la entrega: ' . $e->getMessage());
        }
    }

    /*
    Registra la devolución de una llave a partir del ID del registro activo.
    Evita devoluciones duplicadas verificando fechaHoraDevolucion.
    Actualiza el estado de la llave a disponible en una transacción.
    */
    public function devolverLlave(string $idRegistro, ?string $observaciones = null, ?string $idUsuarioDevolucion = null): array
    {
        if (!Uuid::isValid($idRegistro)) {
            throw new \InvalidArgumentException('El ID de registro no tiene un formato UUID válido.');
        }

        $registro = $this->registroRepository->find($idRegistro);
        if (!$registro) {
            throw new \InvalidArgumentException('El registro especificado no existe.', 404);
        }

        if ($registro->getFechaHoraDevolucion() !== null) {
            throw new \InvalidArgumentException('Esta llave ya fue devuelta o procesada anteriormente.');
        }

        if ($registro->getTipoAccion() !== 'entrega') {
            throw new \InvalidArgumentException('Solo se puede devolver un registro de tipo "entrega".');
        }

        $llave = $registro->getLlave();
        if (!$llave) {
            throw new \InvalidArgumentException('El registro no tiene una llave asociada.');
        }

        $this->em->beginTransaction();

        try {
            $registro->setFechaHoraDevolucion(new \DateTimeImmutable());
            $registro->setTipoAccion('devolucion');

            if ($idUsuarioDevolucion && Uuid::isValid($idUsuarioDevolucion)) {
                $usuario = $this->usuarioRepository->find($idUsuarioDevolucion);
                if ($usuario) {
                    $registro->setUsuarioDevolucion($usuario);
                }
            }

            if ($observaciones !== null) {
                $registro->setObservaciones($observaciones);
            }

            $llave->setEstado(Llave::ESTADO_DISPONIBLE);

            $this->em->flush();
            $this->em->commit();

            return $this->aArray($registro);

        } catch (\Exception $e) {
            $this->em->rollback();
            throw new \RuntimeException('Error al registrar la devolución: ' . $e->getMessage());
        }
    }

    /*
    Marca una llave como perdida a partir del ID del registro activo.
    Cambia el estado de la llave a "perdida" y registra la fecha.
    Evita marcar como perdida llaves ya devueltas o ya perdidas.
    */
    public function marcarComoPerdida(string $idRegistro, ?string $observaciones = null, ?string $idUsuarioAccion = null): array
    {
        if (!Uuid::isValid($idRegistro)) {
            throw new \InvalidArgumentException('El ID de registro no tiene un formato UUID válido.');
        }

        $registro = $this->registroRepository->find($idRegistro);
        if (!$registro) {
            throw new \InvalidArgumentException('El registro especificado no existe.', 404);
        }

        if ($registro->getFechaHoraDevolucion() !== null) {
            throw new \InvalidArgumentException('No se puede marcar como perdida una llave que ya fue devuelta.');
        }

        if ($registro->getTipoAccion() !== 'entrega') {
            throw new \InvalidArgumentException('Solo se puede marcar como perdida un registro de tipo "entrega".');
        }

        $llave = $registro->getLlave();
        if (!$llave) {
            throw new \InvalidArgumentException('El registro no tiene una llave asociada.');
        }

        if ($llave->estaPerdida()) {
            throw new \InvalidArgumentException('La llave ya está marcada como perdida.');
        }

        $this->em->beginTransaction();

        try {
            $registro->setTipoAccion('perdida');
            $registro->setFechaHoraDevolucion(new \DateTimeImmutable());

            if ($idUsuarioAccion && Uuid::isValid($idUsuarioAccion)) {
                $usuario = $this->usuarioRepository->find($idUsuarioAccion);
                if ($usuario) {
                    $registro->setUsuarioDevolucion($usuario);
                }
            }

            if ($observaciones !== null) {
                $registro->setObservaciones($observaciones);
            }

            $llave->setEstado(Llave::ESTADO_PERDIDA);

            $this->em->flush();
            $this->em->commit();

            return $this->aArray($registro);

        } catch (\Exception $e) {
            $this->em->rollback();
            throw new \RuntimeException('Error al marcar la llave como perdida: ' . $e->getMessage());
        }
    }

    /*
    Marca una llave como perdida cuando NO está prestada (está disponible en el centro).
    Crea un nuevo registro de tipo "perdida" para reflejarlo en el historial.
    */
    public function marcarLlaveComoPerdidaDirectamente(string $idLlave, ?string $observaciones = null, ?string $idUsuario = null): array
    {
        if (!Uuid::isValid($idLlave)) {
            throw new \InvalidArgumentException('El ID de llave no tiene un formato UUID válido.');
        }

        $llave = $this->llaveRepository->find($idLlave);
        if (!$llave) {
            throw new \InvalidArgumentException('La llave especificada no existe.', 404);
        }

        if ($llave->estaPerdida()) {
            throw new \InvalidArgumentException('La llave ya está marcada como perdida.');
        }

        $this->em->beginTransaction();

        try {
            $llave->setEstado(Llave::ESTADO_PERDIDA);

            $registro = new Registro();
            $registro->setLlave($llave);
            
            // Para acciones directas, el "Profesor" es el personal que realiza la acción
            if ($idUsuario && Uuid::isValid($idUsuario)) {
                $usuario = $this->usuarioRepository->find($idUsuario);
                if ($usuario) {
                    $registro->setNombreUsuario($usuario->getNombre());
                    $registro->setUsuarioDevolucion($usuario);
                } else {
                    $registro->setNombreUsuario('Personal desconocido');
                }
            } else {
                $registro->setNombreUsuario('Acción de sistema');
            }

            // El campo usuario se deja null para indicar que no fue una entrega física a un profesor
            $registro->setUsuario(null);

            $registro->setFechaHoraEntrega(new \DateTimeImmutable());
            $registro->setFechaHoraDevolucion(new \DateTimeImmutable());
            $registro->setTipoAccion('perdida');
            $registro->setObservaciones($observaciones ?: 'Llave marcada como perdida desde el centro.');

            $this->em->persist($registro);
            $this->em->flush();
            $this->em->commit();

            return $this->aArray($registro);

        } catch (\Exception $e) {
            $this->em->rollback();
            throw new \RuntimeException('Error al marcar la llave como perdida directamente: ' . $e->getMessage());
        }
    }

    /*
    Restaura una llave marcada como perdida a su estado disponible.
    Crea un nuevo registro de tipo "restauracion" para reflejar el hallazgo en el historial.
    */
    public function restaurarLlave(string $idLlave, ?string $observaciones = null, ?string $idUsuario = null): array
    {
        if (!Uuid::isValid($idLlave)) {
            throw new \InvalidArgumentException('El ID de llave no tiene un formato UUID válido.');
        }

        $llave = $this->llaveRepository->find($idLlave);
        if (!$llave) {
            throw new \InvalidArgumentException('La llave especificada no existe.', 404);
        }

        if (!$llave->estaPerdida()) {
            throw new \InvalidArgumentException('Solo se pueden restaurar llaves que estén en estado "perdida".');
        }

        $this->em->beginTransaction();

        try {
            $llave->setEstado(Llave::ESTADO_DISPONIBLE);

            $registro = new Registro();
            $registro->setLlave($llave);
            
            if ($idUsuario && Uuid::isValid($idUsuario)) {
                $usuario = $this->usuarioRepository->find($idUsuario);
                if ($usuario) {
                    $registro->setNombreUsuario($usuario->getNombre());
                    $registro->setUsuarioDevolucion($usuario);
                } else {
                    $registro->setNombreUsuario('Personal desconocido');
                }
            } else {
                $registro->setNombreUsuario('Acción de sistema');
            }

            // El campo usuario se deja null para indicar acción de sistema
            $registro->setUsuario(null);

            $registro->setFechaHoraEntrega(new \DateTimeImmutable());
            $registro->setFechaHoraDevolucion(new \DateTimeImmutable());
            $registro->setTipoAccion('restauracion');
            $registro->setObservaciones($observaciones ?: 'Llave restaurada tras pérdida.');

            $this->em->persist($registro);
            $this->em->flush();
            $this->em->commit();

            return $this->aArray($registro);

        } catch (\Exception $e) {
            $this->em->rollback();
            throw new \RuntimeException('Error al restaurar la llave: ' . $e->getMessage());
        }
    }

    // Devuelve todos los registros del sistema serializados como array.
    public function obtenerTodos(): array
    {
        $registros = $this->registroRepository->findAll();
        return array_map([$this, 'aArray'], $registros);
    }

    // Busca un registro por su UUID y lo devuelve como array, o null si no existe.
    public function obtenerPorId(string $idRegistro): ?array
    {
        if (!Uuid::isValid($idRegistro)) {
            throw new \InvalidArgumentException('El ID de registro no tiene un formato UUID válido.');
        }

        $registro = $this->registroRepository->find($idRegistro);

        return $registro ? $this->aArray($registro) : null;
    }
}
