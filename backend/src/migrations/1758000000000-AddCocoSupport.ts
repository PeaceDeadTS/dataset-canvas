import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCocoSupport1758000000000 implements MigrationInterface {
  name = 'AddCocoSupport1758000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add format column to datasets table
    await queryRunner.query(`
      ALTER TABLE \`datasets\` 
      ADD COLUMN \`format\` ENUM('csv', 'coco') NOT NULL DEFAULT 'csv'
    `);

    // Add COCO-specific columns to dataset_image table
    await queryRunner.query(`
      ALTER TABLE \`dataset_image\` 
      ADD COLUMN \`cocoImageId\` INT NULL,
      ADD COLUMN \`additionalCaptions\` JSON NULL,
      ADD COLUMN \`license\` VARCHAR(255) NULL,
      ADD COLUMN \`flickrUrl\` TEXT NULL
    `);

    // Add index for cocoImageId for faster lookups
    await queryRunner.query(`
      CREATE INDEX \`IDX_dataset_image_cocoImageId\` 
      ON \`dataset_image\` (\`cocoImageId\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(`
      DROP INDEX \`IDX_dataset_image_cocoImageId\` 
      ON \`dataset_image\`
    `);

    // Remove COCO-specific columns from dataset_image
    await queryRunner.query(`
      ALTER TABLE \`dataset_image\` 
      DROP COLUMN \`flickrUrl\`,
      DROP COLUMN \`license\`,
      DROP COLUMN \`additionalCaptions\`,
      DROP COLUMN \`cocoImageId\`
    `);

    // Remove format column from datasets
    await queryRunner.query(`
      ALTER TABLE \`datasets\` 
      DROP COLUMN \`format\`
    `);
  }
}

