import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMarkdownDescriptionToDatasets1758200000000 implements MigrationInterface {
    name = 'AddMarkdownDescriptionToDatasets1758200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add descriptionMarkdown column to datasets table
        await queryRunner.query(`
            ALTER TABLE \`datasets\` 
            ADD \`descriptionMarkdown\` LONGTEXT NULL
        `);
        
        // Copy existing description to descriptionMarkdown as initial value
        // This ensures backward compatibility
        await queryRunner.query(`
            UPDATE \`datasets\` 
            SET \`descriptionMarkdown\` = \`description\` 
            WHERE \`description\` IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove descriptionMarkdown column
        await queryRunner.query(`
            ALTER TABLE \`datasets\` 
            DROP COLUMN \`descriptionMarkdown\`
        `);
    }
}

