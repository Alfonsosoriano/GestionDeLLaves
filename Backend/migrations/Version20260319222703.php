<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260319222703 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE llaves (id BINARY(16) NOT NULL, codigo_barras VARCHAR(100) NOT NULL, descripcion VARCHAR(255) NOT NULL, estado VARCHAR(20) NOT NULL, fecha_creacion DATETIME NOT NULL, llave_original_id BINARY(16) DEFAULT NULL, UNIQUE INDEX UNIQ_9056CF2EDE750AA (codigo_barras), INDEX IDX_9056CF2E7E269E1B (llave_original_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE registros (id BINARY(16) NOT NULL, nombre_profesor VARCHAR(255) NOT NULL, fecha_hora_entrega DATETIME NOT NULL, fecha_hora_devolucion DATETIME DEFAULT NULL, llave_id BINARY(16) NOT NULL, usuario_id BINARY(16) NOT NULL, INDEX IDX_E78E3BDF8EB29E8F (llave_id), INDEX IDX_E78E3BDFDB38439E (usuario_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE usuarios (id BINARY(16) NOT NULL, nombre VARCHAR(255) NOT NULL, usuario VARCHAR(180) NOT NULL, contraseña VARCHAR(255) NOT NULL, codigo_barras VARCHAR(255) NOT NULL, rol VARCHAR(50) NOT NULL, UNIQUE INDEX UNIQ_EF687F22265B05D (usuario), UNIQUE INDEX UNIQ_EF687F2DE750AA (codigo_barras), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL, available_at DATETIME NOT NULL, delivered_at DATETIME DEFAULT NULL, INDEX IDX_75EA56E0FB7336F0E3BD61CE16BA31DBBF396750 (queue_name, available_at, delivered_at, id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('ALTER TABLE llaves ADD CONSTRAINT FK_9056CF2E7E269E1B FOREIGN KEY (llave_original_id) REFERENCES llaves (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE registros ADD CONSTRAINT FK_E78E3BDF8EB29E8F FOREIGN KEY (llave_id) REFERENCES llaves (id)');
        $this->addSql('ALTER TABLE registros ADD CONSTRAINT FK_E78E3BDFDB38439E FOREIGN KEY (usuario_id) REFERENCES usuarios (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE llaves DROP FOREIGN KEY FK_9056CF2E7E269E1B');
        $this->addSql('ALTER TABLE registros DROP FOREIGN KEY FK_E78E3BDF8EB29E8F');
        $this->addSql('ALTER TABLE registros DROP FOREIGN KEY FK_E78E3BDFDB38439E');
        $this->addSql('DROP TABLE llaves');
        $this->addSql('DROP TABLE registros');
        $this->addSql('DROP TABLE usuarios');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
