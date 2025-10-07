import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermissionsSystem1757600000000 implements MigrationInterface {
    name = 'AddPermissionsSystem1757600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Создаем таблицу permissions
        await queryRunner.query(`CREATE TABLE \`permissions\` (
            \`id\` varchar(36) NOT NULL, 
            \`name\` varchar(100) NOT NULL, 
            \`displayName\` varchar(255) NOT NULL, 
            \`description\` text NULL, 
            \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
            \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
            UNIQUE INDEX \`IDX_permissions_name\` (\`name\`), 
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);

        // Создаем таблицу связи user_permissions (many-to-many)
        await queryRunner.query(`CREATE TABLE \`user_permissions\` (
            \`userId\` varchar(36) NOT NULL, 
            \`permissionId\` varchar(36) NOT NULL, 
            INDEX \`IDX_user_permissions_userId\` (\`userId\`), 
            INDEX \`IDX_user_permissions_permissionId\` (\`permissionId\`), 
            PRIMARY KEY (\`userId\`, \`permissionId\`)
        ) ENGINE=InnoDB`);

        // Создаем таблицу caption_edit_history
        await queryRunner.query(`CREATE TABLE \`caption_edit_history\` (
            \`id\` varchar(36) NOT NULL, 
            \`imageId\` int NOT NULL, 
            \`userId\` varchar(36) NULL, 
            \`oldCaption\` text NOT NULL, 
            \`newCaption\` text NOT NULL, 
            \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
            INDEX \`IDX_caption_edit_history_imageId\` (\`imageId\`), 
            INDEX \`IDX_caption_edit_history_userId\` (\`userId\`), 
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);

        // Добавляем внешние ключи для user_permissions
        await queryRunner.query(`ALTER TABLE \`user_permissions\` 
            ADD CONSTRAINT \`FK_user_permissions_user\` 
            FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`user_permissions\` 
            ADD CONSTRAINT \`FK_user_permissions_permission\` 
            FOREIGN KEY (\`permissionId\`) REFERENCES \`permissions\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Добавляем внешние ключи для caption_edit_history
        await queryRunner.query(`ALTER TABLE \`caption_edit_history\` 
            ADD CONSTRAINT \`FK_caption_edit_history_image\` 
            FOREIGN KEY (\`imageId\`) REFERENCES \`dataset_image\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`caption_edit_history\` 
            ADD CONSTRAINT \`FK_caption_edit_history_user\` 
            FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) 
            ON DELETE SET NULL ON UPDATE NO ACTION`);

        // Добавляем базовые права (seed данные)
        // Используем UUID v4 для ID
        const editCaptionPermissionId = '550e8400-e29b-41d4-a716-446655440001';
        
        await queryRunner.query(`INSERT INTO \`permissions\` 
            (\`id\`, \`name\`, \`displayName\`, \`description\`, \`createdAt\`, \`updatedAt\`) 
            VALUES 
            ('${editCaptionPermissionId}', 'edit_caption', 'Edit Caption', 
             'Позволяет редактировать подписи изображений в датасетах', 
             NOW(), NOW())`);

        // Даем права edit_caption всем администраторам
        await queryRunner.query(`
            INSERT INTO \`user_permissions\` (\`userId\`, \`permissionId\`)
            SELECT \`id\`, '${editCaptionPermissionId}'
            FROM \`users\`
            WHERE \`role\` = 'Administrator'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Удаляем внешние ключи
        await queryRunner.query(`ALTER TABLE \`caption_edit_history\` DROP FOREIGN KEY \`FK_caption_edit_history_user\``);
        await queryRunner.query(`ALTER TABLE \`caption_edit_history\` DROP FOREIGN KEY \`FK_caption_edit_history_image\``);
        await queryRunner.query(`ALTER TABLE \`user_permissions\` DROP FOREIGN KEY \`FK_user_permissions_permission\``);
        await queryRunner.query(`ALTER TABLE \`user_permissions\` DROP FOREIGN KEY \`FK_user_permissions_user\``);

        // Удаляем таблицы
        await queryRunner.query(`DROP TABLE \`caption_edit_history\``);
        await queryRunner.query(`DROP TABLE \`user_permissions\``);
        await queryRunner.query(`DROP TABLE \`permissions\``);
    }
}

