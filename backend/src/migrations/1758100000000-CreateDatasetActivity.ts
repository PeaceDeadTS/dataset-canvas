import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatasetActivity1758100000000 implements MigrationInterface {
  name = 'CreateDatasetActivity1758100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dataset_activity table
    await queryRunner.query(`
      CREATE TABLE \`dataset_activity\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`activityType\` enum('dataset_created', 'file_uploaded') NOT NULL,
        \`userId\` char(36) NOT NULL,
        \`datasetId\` int NOT NULL,
        \`fileName\` varchar(255) NULL,
        \`imageCount\` int NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX \`IDX_dataset_activity_userId\` ON \`dataset_activity\` (\`userId\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_dataset_activity_datasetId\` ON \`dataset_activity\` (\`datasetId\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_dataset_activity_createdAt\` ON \`dataset_activity\` (\`createdAt\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_dataset_activity_type\` ON \`dataset_activity\` (\`activityType\`)
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE \`dataset_activity\`
      ADD CONSTRAINT \`FK_dataset_activity_user\`
      FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`dataset_activity\`
      ADD CONSTRAINT \`FK_dataset_activity_dataset\`
      FOREIGN KEY (\`datasetId\`) REFERENCES \`datasets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE \`dataset_activity\` DROP FOREIGN KEY \`FK_dataset_activity_dataset\``
    );

    await queryRunner.query(
      `ALTER TABLE \`dataset_activity\` DROP FOREIGN KEY \`FK_dataset_activity_user\``
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX \`IDX_dataset_activity_type\` ON \`dataset_activity\``
    );

    await queryRunner.query(
      `DROP INDEX \`IDX_dataset_activity_createdAt\` ON \`dataset_activity\``
    );

    await queryRunner.query(
      `DROP INDEX \`IDX_dataset_activity_datasetId\` ON \`dataset_activity\``
    );

    await queryRunner.query(
      `DROP INDEX \`IDX_dataset_activity_userId\` ON \`dataset_activity\``
    );

    // Drop table
    await queryRunner.query(`DROP TABLE \`dataset_activity\``);
  }
}

