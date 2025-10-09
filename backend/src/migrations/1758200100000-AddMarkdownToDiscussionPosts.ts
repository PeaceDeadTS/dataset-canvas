import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMarkdownToDiscussionPosts1758200100000 implements MigrationInterface {
    name = 'AddMarkdownToDiscussionPosts1758200100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add content_markdown column to discussion_posts table
        await queryRunner.query(`
            ALTER TABLE \`discussion_posts\` 
            ADD \`content_markdown\` LONGTEXT NULL
        `);
        
        // Copy existing content to content_markdown as initial value
        await queryRunner.query(`
            UPDATE \`discussion_posts\` 
            SET \`content_markdown\` = \`content\` 
            WHERE \`content\` IS NOT NULL
        `);
        
        // Add contentMarkdown to discussion_edit_history table
        await queryRunner.query(`
            ALTER TABLE \`discussion_edit_history\` 
            ADD \`old_content_markdown\` LONGTEXT NULL,
            ADD \`new_content_markdown\` LONGTEXT NULL
        `);
        
        // Copy existing content to markdown columns in history
        await queryRunner.query(`
            UPDATE \`discussion_edit_history\` 
            SET \`old_content_markdown\` = \`old_content\`,
                \`new_content_markdown\` = \`new_content\`
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove markdown columns from edit history
        await queryRunner.query(`
            ALTER TABLE \`discussion_edit_history\` 
            DROP COLUMN \`old_content_markdown\`,
            DROP COLUMN \`new_content_markdown\`
        `);
        
        // Remove content_markdown column from posts
        await queryRunner.query(`
            ALTER TABLE \`discussion_posts\` 
            DROP COLUMN \`content_markdown\`
        `);
    }
}

