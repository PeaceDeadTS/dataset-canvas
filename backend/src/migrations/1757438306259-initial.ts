import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1757438306259 implements MigrationInterface {
    name = 'Initial1757438306259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`dataset_image\` (\`id\` int NOT NULL AUTO_INCREMENT, \`img_key\` varchar(255) NOT NULL, \`row_number\` int NOT NULL, \`filename\` varchar(255) NOT NULL, \`url\` varchar(255) NOT NULL, \`width\` int NOT NULL, \`height\` int NOT NULL, \`prompt\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`datasetId\` uuid NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`datasets\` (\`id\` uuid NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`isPublic\` tinyint NOT NULL DEFAULT 1, \`userId\` uuid NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` uuid NOT NULL, \`username\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` varchar(255) NOT NULL DEFAULT 'User', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`dataset_image\` ADD CONSTRAINT \`FK_1cc88549a707765a82f859d9dd2\` FOREIGN KEY (\`datasetId\`) REFERENCES \`datasets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`datasets\` ADD CONSTRAINT \`FK_b8c922f11b23d23aa64745a503b\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`datasets\` DROP FOREIGN KEY \`FK_b8c922f11b23d23aa64745a503b\``);
        await queryRunner.query(`ALTER TABLE \`dataset_image\` DROP FOREIGN KEY \`FK_1cc88549a707765a82f859d9dd2\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`datasets\``);
        await queryRunner.query(`DROP TABLE \`dataset_image\``);
    }

}
