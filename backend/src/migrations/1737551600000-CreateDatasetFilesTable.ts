import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatasetFilesTable1737551600000 implements MigrationInterface {
    name = 'CreateDatasetFilesTable1737551600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`dataset_files\` (
            \`id\` int NOT NULL AUTO_INCREMENT, 
            \`filename\` varchar(255) NOT NULL, 
            \`originalName\` varchar(255) NOT NULL, 
            \`mimeType\` varchar(100) NOT NULL, 
            \`size\` int NOT NULL, 
            \`filePath\` varchar(500) NOT NULL, 
            \`description\` text NULL, 
            \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
            \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
            \`datasetId\` uuid NULL, 
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);
        
        await queryRunner.query(`ALTER TABLE \`dataset_files\` ADD CONSTRAINT \`FK_dataset_files_dataset\` FOREIGN KEY (\`datasetId\`) REFERENCES \`datasets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`dataset_files\` DROP FOREIGN KEY \`FK_dataset_files_dataset\``);
        await queryRunner.query(`DROP TABLE \`dataset_files\``);
    }
}
