import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1757451967058 implements MigrationInterface {
    name = 'InitialSchema1757451967058'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`dataset_image\` DROP FOREIGN KEY \`FK_1cc88549a707765a82f859d9dd2\``);
        await queryRunner.query(`ALTER TABLE \`dataset_image\` ADD CONSTRAINT \`FK_1cc88549a707765a82f859d9dd2\` FOREIGN KEY (\`datasetId\`) REFERENCES \`datasets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`dataset_image\` DROP FOREIGN KEY \`FK_1cc88549a707765a82f859d9dd2\``);
        await queryRunner.query(`ALTER TABLE \`dataset_image\` ADD CONSTRAINT \`FK_1cc88549a707765a82f859d9dd2\` FOREIGN KEY (\`datasetId\`) REFERENCES \`datasets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
