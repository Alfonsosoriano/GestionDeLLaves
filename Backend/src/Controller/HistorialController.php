<?php

namespace App\Controller;

use App\Entity\Registro;
use App\Entity\Llave;
use App\Entity\Usuario;
use App\Repository\RegistroRepository;
use App\Repository\LlaveRepository;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/historial')]
class HistorialController extends AbstractController
{
    public function __construct(
        private RegistroRepository $registroRepository,
        private LlaveRepository $llaveRepository,
        private UsuarioRepository $usuarioRepository,
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer
    ) {}

    // Obtener todo el historial de entregas/devoluciones o los de HOY si se solicita.
    // Obtener todo el historial de entregas/devoluciones con paginación.
    #[Route('', name: 'historial_indice', methods: ['GET'])]
    public function indice(Request $request): JsonResponse
    {
        try {
            $pagina = $request->query->getInt('page', 1);
            $limite = $request->query->getInt('limit', 10);
            $desplazamiento = ($pagina - 1) * $limite;

            $tipo = $request->query->get('tipo'); // 'entrega' o 'devolución'
            $soloHoy = $request->query->get('hoy') === 'true';
            $busqueda = $request->query->get('search');
            
            $consulta = $this->registroRepository->createQueryBuilder('r')
                ->leftJoin('r.llave', 'l')
                ->leftJoin('r.usuario', 'u')
                ->orderBy('r.fechaHoraEntrega', 'DESC');

            if ($soloHoy) {
                $hoy = new \DateTimeImmutable('today');
                $manana = $hoy->modify('+1 day');
                
                $consulta->andWhere(
                    $consulta->expr()->orX(
                        $consulta->expr()->andX(
                            'r.fechaHoraEntrega >= :inicio',
                            'r.fechaHoraEntrega < :fin'
                        ),
                        'r.fechaHoraDevolucion IS NULL'
                    )
                )
                ->setParameter('inicio', $hoy)
                ->setParameter('fin', $manana);
            }

            if ($tipo && $tipo !== 'Todas') {
                $consulta->andWhere('r.tipoAccion = :tipo')
                   ->setParameter('tipo', strtolower($tipo));
            }

            if ($busqueda) {
                $consulta->andWhere('r.nombreUsuario LIKE :busqueda OR l.descripcion LIKE :busqueda OR u.nombre LIKE :busqueda')
                   ->setParameter('busqueda', '%' . $busqueda . '%');
            }

            // Clonamos para contar el total sin límites
            $totalConsulta = clone $consulta;
            $total = $totalConsulta->select('COUNT(r.id)')->getQuery()->getSingleScalarResult();

            $registros = $consulta->setFirstResult($desplazamiento)
                ->setMaxResults($limite)
                ->getQuery()
                ->getResult();

            $datos = [];
            foreach ($registros as $registro) {
                $datos[] = [
                    'id' => $registro->getId()?->toRfc4122(),
                    'fechaHora' => $registro->getFechaHoraEntrega()?->format('d/m/Y H:i'),
                    'fecha' => $registro->getFechaHoraEntrega()?->format('d/m/Y'),
                    'horaEntrega' => $registro->getFechaHoraEntrega()?->format('H:i'),
                    'horaDevolucion' => $registro->getFechaHoraDevolucion()?->format('H:i'),
                    'usuario' => $registro->getNombreUsuario() ?? 'Desconocido',
                    'profesorAlumno' => $registro->getNombreUsuario() ?? 'Desconocido',
                    'llave' => $registro->getLlave() ? $registro->getLlave()->getDescripcion() : 'Desconocida',
                    'accion' => $registro->getTipoAccion() ?? 'entrega',
                    'ordenanza' => $registro->getUsuario() ? $registro->getUsuario()->getNombre() : null,
                    'ordenanzaDevolucion' => $registro->getUsuarioDevolucion() ? $registro->getUsuarioDevolucion()->getNombre() : null,
                    'estado' => $registro->getFechaHoraDevolucion() ? 'devuelta' : 'entregada',
                    'fechaDevolucion' => $registro->getFechaHoraDevolucion()?->format('d/m/Y H:i'),
                    'observaciones' => $registro->getObservaciones()
                ];
            }

            return new JsonResponse([
                'data' => $datos,
                'total' => (int)$total,
                'page' => $pagina,
                'lastPage' => ceil($total / $limite)
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            error_log("Error en HistorialController: " . $e->getMessage());
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // Obtener un registro específico del historial
    #[Route('/{id}', name: 'historial_mostrar', methods: ['GET'])]
    public function mostrar(Registro $registro): JsonResponse
    {
        $data = $this->serializer->serialize($registro, 'json');

        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    // Registrar entrega de llave
    #[Route('/entrega', name: 'historial_entrega', methods: ['POST'])]
    public function registrarEntrega(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $llave = $this->llaveRepository->find($data['llaveId']);
        $usuario = $this->usuarioRepository->find($data['usuarioId']);

        if (!$llave || !$usuario) {
            return new JsonResponse(['error' => 'Llave o Usuario no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $registro = new Registro();
        $registro->setLlave($llave);
        $registro->setUsuario($usuario);
        $registro->setNombreUsuario($usuario->getNombre());
        $registro->setFechaHoraEntrega(new \DateTimeImmutable());
        $registro->setTipoAccion('entrega');
        $registro->setObservaciones($data['observaciones'] ?? null);

        $this->entityManager->persist($registro);
        $this->entityManager->flush();

        $responseData = $this->serializer->serialize($registro, 'json');

        return new JsonResponse($responseData, Response::HTTP_CREATED, [], true);
    }

    // Registrar devolución de llave
    #[Route('/{id}/devolucion', name: 'historial_devolucion', methods: ['PUT'])]
    public function registrarDevolucion(Request $request, Registro $registro): JsonResponse
    {
        $registro->setFechaHoraDevolucion(new \DateTimeImmutable());
        $registro->setTipoAccion('devolucion');

        $data = json_decode($request->getContent(), true);
        if (isset($data['observaciones'])) {
            $registro->setObservaciones($data['observaciones']);
        }

        $this->entityManager->flush();

        $data = $this->serializer->serialize($registro, 'json');

        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    // Obtener historial de un usuario específico
    #[Route('/usuario/{usuarioId}', name: 'historial_usuario', methods: ['GET'])]
    public function historialUsuario(string $usuarioId): JsonResponse
    {
        $usuario = $this->usuarioRepository->find($usuarioId);

        if (!$usuario) {
            return new JsonResponse(['error' => 'Usuario no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $registros = $this->registroRepository->findBy(['usuario' => $usuario]);

        $data = $this->serializer->serialize($registros, 'json');

        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    // Obtener historial de una llave específica
    #[Route('/llave/{llaveId}', name: 'historial_llave', methods: ['GET'])]
    public function historialLlave(string $llaveId): JsonResponse
    {
        $llave = $this->llaveRepository->find($llaveId);

        if (!$llave) {
            return new JsonResponse(['error' => 'Llave no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $registros = $this->registroRepository->findBy(['llave' => $llave]);

        $data = $this->serializer->serialize($registros, 'json');

        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    // Eliminar un registro del historial
    #[Route('/{id}', name: 'historial_eliminar', methods: ['DELETE'])]
    public function eliminar(Registro $registro): JsonResponse
    {
        $this->entityManager->remove($registro);
        $this->entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
