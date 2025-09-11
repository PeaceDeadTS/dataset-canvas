import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateDatasetFilesTable1737551600000 implements MigrationInterface {
    name = 'CreateDatasetFilesTable1737551600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create dataset_files table
        await queryRunner.createTable(new Table({
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
                    name: 'createdAt',
                    type: 'datetime',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updatedAt',
                    type: 'datetime',
                    default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
                },
                {
                    name: 'datasetId',
                    type: 'varchar',
                    length: '36',
                },
            ],
            foreignKeys: [
                {
                    name: 'FK_dataset_files_dataset',
                    columnNames: ['datasetId'],
                    referencedTableName: 'datasets',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                },
            ],
            indices: [
                {
                    name: 'IDX_dataset_files_datasetId',
                    columnNames: ['datasetId'],
                },
            ],
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop dataset_files table
        await queryRunner.dropTable('dataset_files');
    }
}
