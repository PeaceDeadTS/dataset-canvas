import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDatasetFilesTable1737551600000 implements MigrationInterface {
    name = 'CreateDatasetFilesTable1737551600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if users table exists first
        const usersTableExists = await queryRunner.hasTable('users');
        if (!usersTableExists) {
            // Create users table first if it doesn't exist
            await queryRunner.createTable(
                new Table({
                    name: 'users',
                    columns: [
                        {
                            name: 'id',
                            type: 'varchar',
                            length: '36',
                            isPrimary: true,
                        },
                        {
                            name: 'username',
                            type: 'varchar',
                            length: '255',
                            isUnique: true,
                        },
                        {
                            name: 'email',
                            type: 'varchar',
                            length: '255',
                            isUnique: true,
                        },
                        {
                            name: 'password',
                            type: 'varchar',
                            length: '255',
                        },
                        {
                            name: 'role',
                            type: 'enum',
                            enum: ['Administrator', 'Developer', 'User'],
                            default: "'User'",
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
        }

        // Check if datasets table exists first
        const datasetsTableExists = await queryRunner.hasTable('datasets');
        if (!datasetsTableExists) {
            // Create datasets table first if it doesn't exist
            await queryRunner.createTable(
                new Table({
                    name: 'datasets',
                    columns: [
                        {
                            name: 'id',
                            type: 'varchar',
                            length: '36',
                            isPrimary: true,
                        },
                        {
                            name: 'name',
                            type: 'varchar',
                            length: '255',
                        },
                        {
                            name: 'description',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'isPublic',
                            type: 'boolean',
                            default: true,
                        },
                        {
                            name: 'userId',
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

            // Create foreign key for datasets -> users
            await queryRunner.createForeignKey('datasets', new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
                name: 'FK_datasets_userId'
            }));
        }

        // Check if dataset_images table exists
        const datasetImagesTableExists = await queryRunner.hasTable('dataset_images');
        if (!datasetImagesTableExists) {
            // Create dataset_images table
            await queryRunner.createTable(
                new Table({
                    name: 'dataset_images',
                    columns: [
                        {
                            name: 'id',
                            type: 'int',
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: 'increment',
                        },
                        {
                            name: 'img_key',
                            type: 'varchar',
                            length: '36',
                        },
                        {
                            name: 'row_number',
                            type: 'int',
                        },
                        {
                            name: 'filename',
                            type: 'varchar',
                            length: '255',
                        },
                        {
                            name: 'url',
                            type: 'text',
                        },
                        {
                            name: 'width',
                            type: 'int',
                            default: 0,
                        },
                        {
                            name: 'height',
                            type: 'int',
                            default: 0,
                        },
                        {
                            name: 'prompt',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'datasetId',
                            type: 'varchar',
                            length: '36',
                        },
                    ],
                }),
                true,
            );

            // Create foreign key for dataset_images -> datasets
            await queryRunner.createForeignKey('dataset_images', new TableForeignKey({
                columnNames: ['datasetId'],
                referencedTableName: 'datasets',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
                name: 'FK_dataset_images_datasetId'
            }));
        }

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
