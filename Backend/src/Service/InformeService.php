<?php

namespace App\Service;

use App\Repository\LlaveRepository;
use App\Repository\RegistroRepository;
use App\Repository\UsuarioRepository;

class InformeService
{
    public function __construct(
        private UsuarioRepository $usuarioRepository,
        private LlaveRepository $llaveRepository,
        private RegistroRepository $registroRepository
    ) {}

    public function obtenerResumen(): array
    {
        $totalUsuarios = count($this->usuarioRepository->findAll());
        $totalLlaves = count($this->llaveRepository->findAll());
        $totalRegistros = count($this->registroRepository->findAll());

        $llavesPrestadas = count($this->llaveRepository->findBy(['estado' => 'prestada']));
        $llavesDisponibles = count($this->llaveRepository->findBy(['estado' => 'disponible']));
        $llavesPerdidas = count($this->llaveRepository->findBy(['estado' => 'perdida']));

        return [
            'usuarios' => $totalUsuarios,
            'llaves' => $totalLlaves,
            'registros' => $totalRegistros,
            'llavesPrestadas' => $llavesPrestadas,
            'llavesDisponibles' => $llavesDisponibles,
            'llavesPerdidas' => $llavesPerdidas,
        ];
    }

    public function actividadUsuarios(): array
    {
        $usuarios = $this->usuarioRepository->findAll();
        $resultado = [];

        foreach ($usuarios as $usuario) {
            $registros = $this->registroRepository->findBy(['usuario' => $usuario]);
            $entregas = 0;
            $devoluciones = 0;

            foreach ($registros as $registro) {
                if ($registro->getFechaHoraEntrega()) {
                    $entregas++;
                }
                if ($registro->getFechaHoraDevolucion()) {
                    $devoluciones++;
                }
            }

            $resultado[] = [
                'id' => $usuario->getId(),
                'nombre' => $usuario->getNombre(),
                'usuario' => $usuario->getUsuario(),
                'rol' => $usuario->getRol(),
                'entregas' => $entregas,
                'devoluciones' => $devoluciones,
                'pendientes' => $entregas - $devoluciones,
            ];
        }

        return $resultado;
    }

    public function estadoLlaves(): array
    {
        $llaves = $this->llaveRepository->findAll();
        $resultado = [];

        foreach ($llaves as $llave) {
            $registros = $this->registroRepository->findBy(['llave' => $llave]);
            $ultimoRegistro = $registros ? end($registros) : null;

            $resultado[] = [
                'id' => $llave->getId(),
                'codigoBarras' => $llave->getCodigoBarras(),
                'descripcion' => $llave->getDescripcion(),
                'estado' => $llave->getEstado(),
                'ultimaAccion' => $ultimoRegistro ? $ultimoRegistro->getFechaHoraEntrega() : null,
                'usuarioActual' => $ultimoRegistro?->getUsuario()?->getNombre() ?? 'Disponible',
            ];
        }

        return $resultado;
    }

    public function llavesPendientes(): array
    {
        $llaves = $this->llaveRepository->findBy(['estado' => 'prestada']);
        $resultado = [];

        foreach ($llaves as $llave) {
            $registros = $this->registroRepository->findBy(['llave' => $llave]);
            $ultimoRegistro = $registros ? end($registros) : null;


            if ($ultimoRegistro && !$ultimoRegistro->getFechaHoraDevolucion()) {
                $resultado[] = [
                    'llave' => [
                        'id' => $llave->getId(),
                        'codigoBarras' => $llave->getCodigoBarras(),
                        'descripcion' => $llave->getDescripcion(),
                    ],
                    'usuario' => [
                        'id' => $ultimoRegistro->getUsuario()->getId(),
                        'nombre' => $ultimoRegistro->getUsuario()->getNombre(),
                    ],
                    'fechaEntrega' => $ultimoRegistro->getFechaHoraEntrega(),
                    'diasPendiente' => $this->calcularDiasPendiente($ultimoRegistro->getFechaHoraEntrega()),
                ];
            }
        }

        return $resultado;
    }

    public function llavesPerdidas(): array
    {
        $llaves = $this->llaveRepository->findBy(['estado' => 'perdida']);
        $resultado = [];

        foreach ($llaves as $llave) {
            $resultado[] = [
                'id' => $llave->getId(),
                'codigoBarras' => $llave->getCodigoBarras(),
                'descripcion' => $llave->getDescripcion(),
                'estado' => $llave->getEstado(),
            ];
        }

        return $resultado;
    }

    public function actividadPeriodo(\DateTimeImmutable $desde, \DateTimeImmutable $hasta): array
    {
        $registros = $this->registroRepository->findAll();
        $registrosPeriodo = array_filter($registros, function ($registro) use ($desde, $hasta) {
            return $registro->getFechaHoraEntrega() >= $desde && $registro->getFechaHoraEntrega() <= $hasta;
        });

        return [
            'periodo' => ['desde' => $desde->format('Y-m-d'), 'hasta' => $hasta->format('Y-m-d')],
            'totalMovimientos' => count($registrosPeriodo),
            'registros' => array_map(fn($registro) => [
                'id' => $registro->getId(),
                'usuario' => $registro->getUsuario()?->getNombre(),
                'llave' => $registro->getLlave()?->getCodigoBarras(),
                'fechaEntrega' => $registro->getFechaHoraEntrega(),
                'fechaDevolucion' => $registro->getFechaHoraDevolucion(),
            ], $registrosPeriodo),
        ];
    }

    private function calcularDiasPendiente(\DateTimeImmutable $fecha): int
    {
        $ahora = new \DateTimeImmutable();
        $diff = $ahora->diff($fecha);

        return $diff->days;
    }
}
