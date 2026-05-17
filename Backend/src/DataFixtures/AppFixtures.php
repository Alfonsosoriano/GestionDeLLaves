<?php

namespace App\DataFixtures;

use App\Entity\Llave;
use App\Entity\Usuario;
use App\Entity\Registro;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(UserPasswordHasherInterface $passwordHasher)
    {
        $this->passwordHasher = $passwordHasher;
    }

    public function load(ObjectManager $manager): void
    {
        // 1. USUARIOS DEL SISTEMA (Administradores y Ordenanzas)
        $usuariosDb = [];
        
        $usuariosData = [
            ['Alfonso Admin', 'admin', 'admin@iesoretania.es', Usuario::ROL_ADMINISTRADOR, 'USUARIO001'],
            ['Lucía Ordenanza', 'luciao', 'lucia@iesoretania.es', Usuario::ROL_ORDENANZA, 'USUARIO101'],
            ['Marcos Ordenanza', 'marcoso', 'marcos@iesoretania.es', Usuario::ROL_ORDENANZA, 'USUARIO102'],
            ['Elena Conserjería', 'elenac', 'elena@iesoretania.es', Usuario::ROL_ORDENANZA, 'USUARIO103'],
            ['Juan Pérez', 'juanp', 'juan.perez@iesoretania.es', Usuario::ROL_ORDENANZA, 'USUARIO104'],
        ];

        foreach ($usuariosData as $data) {
            $u = new Usuario();
            $u->setNombre($data[0]);
            $u->setUsuario($data[1]);
            $u->setEmail($data[2]);
            $u->setRol($data[3]);
            $u->setCodigoBarras($data[4]);
            $u->setPassword($this->passwordHasher->hashPassword($u, 'password123')); // Contraseña por defecto
            $manager->persist($u);
            $usuariosDb[$data[1]] = $u;
        }

        // 2. LLAVES DEL CENTRO (Inventario)
        $llavesDb = [];
        $llavesData = [
            ['LLAVE001', 'Aula Informática 1', Llave::ESTADO_DISPONIBLE],
            ['LLAVE002', 'Aula Informática 2', Llave::ESTADO_PRESTADA],
            ['LLAVE003', 'Biblioteca Principal', Llave::ESTADO_PRESTADA],
            ['LLAVE004', 'Almacén Educación Física', Llave::ESTADO_DISPONIBLE],
            ['LLAVE005', 'Archivo Secretaría', Llave::ESTADO_PERDIDA],
            ['LLAVE006', 'Laboratorio de Química', Llave::ESTADO_DISPONIBLE],
            ['LLAVE007', 'Aula de Música', Llave::ESTADO_DISPONIBLE],
            ['LLAVE008', 'Dirección General', Llave::ESTADO_DISPONIBLE],
            ['LLAVE009', 'Cafetería', Llave::ESTADO_DISPONIBLE],
            ['LLAVE010', 'Gimnasio', Llave::ESTADO_PERDIDA],
        ];

        foreach ($llavesData as $data) {
            $l = new Llave();
            $l->setCodigoBarras($data[0]);
            $l->setDescripcion($data[1]);
            $l->setEstado($data[2]);
            $manager->persist($l);
            $llavesDb[$data[0]] = $l;
        }

        // --- 3. REGISTROS (ESCENARIOS DE USO REALES) ---

        // Escenario A: Préstamo estándar y ya devuelto (Mismo ordenanza entrega y recoge)
        $regA = new Registro();
        $regA->setLlave($llavesDb['LLAVE001']);
        $regA->setNombreUsuario('Prof. Carlos Heredia');
        $regA->setUsuario($usuariosDb['luciao']); // Entrega Lucía
        $regA->setUsuarioDevolucion($usuariosDb['luciao']); // Recoge Lucía
        $regA->setFechaHoraEntrega(new \DateTimeImmutable('-3 days 08:30:00'));
        $regA->setFechaHoraDevolucion(new \DateTimeImmutable('-3 days 14:15:00'));
        $regA->setTipoAccion('devolucion');
        $regA->setObservaciones('Uso normal durante la mañana.');
        $manager->persist($regA);

        // Escenario B: Préstamo con cambio de turno (Ordenanza A entrega, Ordenanza B recoge)
        $regB = new Registro();
        $regB->setLlave($llavesDb['LLAVE004']);
        $regB->setNombreUsuario('Sergio (Alumno 2º Bach)');
        $regB->setUsuario($usuariosDb['marcoso']); // Entrega Marcos por la mañana
        $regB->setUsuarioDevolucion($usuariosDb['elenac']); // Recoge Elena por la tarde
        $regB->setFechaHoraEntrega(new \DateTimeImmutable('-2 days 09:00:00'));
        $regB->setFechaHoraDevolucion(new \DateTimeImmutable('-2 days 18:30:00'));
        $regB->setTipoAccion('devolucion');
        $regB->setObservaciones('El alumno devolvió la llave al finalizar las clases extracurriculares.');
        $manager->persist($regB);

        // Escenario C: Pérdida durante un préstamo (Profesor pierde la llave)
        $regC = new Registro();
        $regC->setLlave($llavesDb['LLAVE005']);
        $regC->setNombreUsuario('Dra. Ana Belén');
        $regC->setUsuario($usuariosDb['elenac']); // Se la dio Elena
        $regC->setUsuarioDevolucion($usuariosDb['admin']); // El administrador registró la pérdida oficial
        $regC->setFechaHoraEntrega(new \DateTimeImmutable('-5 days 10:00:00'));
        $regC->setFechaHoraDevolucion(new \DateTimeImmutable('-4 days 12:00:00'));
        $regC->setTipoAccion('perdida');
        $regC->setObservaciones('La profesora informa que extravió la llave tras una reunión en secretaría.');
        $manager->persist($regC);

        // Escenario D: Pérdida DIRECTA en el centro (Nadie la tenía prestada, desapareció del tablero)
        $regD = new Registro();
        $regD->setLlave($llavesDb['LLAVE010']);
        $regD->setNombreUsuario($usuariosDb['juanp']->getNombre()); // Quién registró la pérdida
        $regD->setUsuario(null); // No hubo préstamo activo
        $regD->setUsuarioDevolucion($usuariosDb['juanp']); // Registro físico del ordenanza
        $regD->setFechaHoraEntrega(new \DateTimeImmutable('-10 days 16:45:00'));
        $regD->setFechaHoraDevolucion(new \DateTimeImmutable('-10 days 16:45:00'));
        $regD->setTipoAccion('perdida');
        $regD->setObservaciones('Al revisar el cajetín de llaves, faltaba la llave del gimnasio.');
        $manager->persist($regD);

        /*
        Escenario E: Restauración de una llave que estaba perdida (La del gimnasio se encontró)
        Ojo, la llave GIM-01 la marcamos como PERDIDA en el inventario inicial, así que hagamos un registro de restauración para LAB-05 que sí está DISPONIBLE, asumiendo que antes se perdió.
        */
        $regE = new Registro();
        $regE->setLlave($llavesDb['LLAVE006']);
        $regE->setNombreUsuario($usuariosDb['luciao']->getNombre()); 
        $regE->setUsuario(null);
        $regE->setUsuarioDevolucion($usuariosDb['luciao']); // Quién la restauró
        $regE->setFechaHoraEntrega(new \DateTimeImmutable('-1 day 19:20:00'));
        $regE->setFechaHoraDevolucion(new \DateTimeImmutable('-1 day 19:20:00'));
        $regE->setTipoAccion('restauracion');
        $regE->setObservaciones('Llave encontrada en el pasillo de la primera planta por el equipo de limpieza.');
        $manager->persist($regE);

        // Escenario F: Préstamo activo (Pendiente de devolución, préstamo reciente)
        $regF = new Registro();
        $regF->setLlave($llavesDb['LLAVE003']);
        $regF->setNombreUsuario('Prof. Roberto (Biblioteca)');
        $regF->setUsuario($usuariosDb['luciao']);
        $regF->setFechaHoraEntrega(new \DateTimeImmutable('-2 hours'));
        $regF->setTipoAccion('entrega');
        $manager->persist($regF);

        // Escenario G: Préstamo muy antiguo pendiente (Debería generar alerta visual en el frontend)
        $regG = new Registro();
        $regG->setLlave($llavesDb['LLAVE002']);
        $regG->setNombreUsuario('Prof. Javier Díaz (Olvido)');
        $regG->setUsuario($usuariosDb['marcoso']);
        $regG->setFechaHoraEntrega(new \DateTimeImmutable('-4 days 10:00:00'));
        $regG->setTipoAccion('entrega');
        $manager->persist($regG);

        $manager->flush();
    }
}
