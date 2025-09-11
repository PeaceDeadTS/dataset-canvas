import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDatasetFilesTable1737551600000 implements MigrationInterface {
    name = 'CreateDatasetFilesTable1737551600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create dataset_files table
        await queryRunner.createTable(
            new Table({
                name: 'dataset_files',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'filename',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'originalName',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'mimeType',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'size',
                        type: 'int',
                    },
                    {
                        name: 'filePath',
                        type: 'varchar',
                        length: '500',
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'datasetId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create foreign key constraint
        await queryRunner.createForeignKey('dataset_files', new TableForeignKey({
            columnNames: ['datasetId'],
            referencedTableName: 'datasets',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            name: 'FK_dataset_files_datasetId'
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint first
        await queryRunner.dropForeignKey('dataset_files', 'FK_dataset_files_datasetId');

        // Drop table
        await queryRunner.dropTable('dataset_files');
    }
}
