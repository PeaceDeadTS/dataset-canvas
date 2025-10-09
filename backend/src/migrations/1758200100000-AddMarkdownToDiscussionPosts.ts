import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMarkdownToDiscussionPosts1758200100000 implements MigrationInterface {
    name = 'AddMarkdownToDiscussionPosts1758200100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add contentMarkdown column to discussion_posts table
        await queryRunner.query(`
            ALTER TABLE \`discussion_posts\` 
            ADD \`contentMarkdown\` LONGTEXT NULL
        `);
        
        // Copy existing content to contentMarkdown as initial value
        await queryRunner.query(`
            UPDATE \`discussion_posts\` 
            SET \`contentMarkdown\` = \`content\` 
            WHERE \`content\` IS NOT NULL
        `);
        
        // Add contentMarkdown to discussion_post_edit_history table
        await queryRunner.query(`
            ALTER TABLE \`discussion_post_edit_history\` 
            ADD \`oldContentMarkdown\` LONGTEXT NULL,
            ADD \`newContentMarkdown\` LONGTEXT NULL
        `);
        
        // Copy existing content to markdown columns in history
        await queryRunner.query(`
            UPDATE \`discussion_post_edit_history\` 
            SET \`oldContentMarkdown\` = \`oldContent\`,
                \`newContentMarkdown\` = \`newContent\`
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove markdown columns from edit history
        await queryRunner.query(`
            ALTER TABLE \`discussion_post_edit_history\` 
            DROP COLUMN \`oldContentMarkdown\`,
            DROP COLUMN \`newContentMarkdown\`
        `);
        
        // Remove contentMarkdown column from posts
        await queryRunner.query(`
            ALTER TABLE \`discussion_posts\` 
            DROP COLUMN \`contentMarkdown\`
        `);
    }
}

