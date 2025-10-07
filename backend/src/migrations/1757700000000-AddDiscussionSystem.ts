import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscussionSystem1757700000000 implements MigrationInterface {
  name = 'AddDiscussionSystem1757700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create discussions table
    await queryRunner.query(`
      CREATE TABLE \`discussions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(255) NOT NULL,
        \`dataset_id\` uuid NOT NULL,
        \`author_id\` uuid NOT NULL,
        \`is_locked\` tinyint NOT NULL DEFAULT 0,
        \`is_pinned\` tinyint NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_DISCUSSION_DATASET\` (\`dataset_id\`),
        INDEX \`IDX_DISCUSSION_AUTHOR\` (\`author_id\`),
        INDEX \`IDX_DISCUSSION_CREATED\` (\`created_at\`),
        CONSTRAINT \`FK_DISCUSSION_DATASET\` FOREIGN KEY (\`dataset_id\`) REFERENCES \`datasets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_DISCUSSION_AUTHOR\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    // Create discussion_posts table
    await queryRunner.query(`
      CREATE TABLE \`discussion_posts\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`discussion_id\` int NOT NULL,
        \`author_id\` uuid NOT NULL,
        \`content\` text NOT NULL,
        \`reply_to_id\` int NULL,
        \`is_deleted\` tinyint NOT NULL DEFAULT 0,
        \`deleted_at\` timestamp NULL,
        \`deleted_by_id\` uuid NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_POST_DISCUSSION\` (\`discussion_id\`),
        INDEX \`IDX_POST_AUTHOR\` (\`author_id\`),
        INDEX \`IDX_POST_REPLY\` (\`reply_to_id\`),
        INDEX \`IDX_POST_CREATED\` (\`created_at\`),
        CONSTRAINT \`FK_POST_DISCUSSION\` FOREIGN KEY (\`discussion_id\`) REFERENCES \`discussions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_POST_AUTHOR\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT \`FK_POST_REPLY\` FOREIGN KEY (\`reply_to_id\`) REFERENCES \`discussion_posts\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT \`FK_POST_DELETED_BY\` FOREIGN KEY (\`deleted_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    // Create discussion_edit_history table
    await queryRunner.query(`
      CREATE TABLE \`discussion_edit_history\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`post_id\` int NOT NULL,
        \`editor_id\` uuid NOT NULL,
        \`old_content\` text NOT NULL,
        \`new_content\` text NOT NULL,
        \`edited_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_EDIT_POST\` (\`post_id\`),
        INDEX \`IDX_EDIT_EDITOR\` (\`editor_id\`),
        INDEX \`IDX_EDIT_TIME\` (\`edited_at\`),
        CONSTRAINT \`FK_EDIT_POST\` FOREIGN KEY (\`post_id\`) REFERENCES \`discussion_posts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_EDIT_EDITOR\` FOREIGN KEY (\`editor_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE \`discussion_edit_history\``
    );
    await queryRunner.query(`DROP TABLE \`discussion_posts\``);
    await queryRunner.query(`DROP TABLE \`discussions\``);
  }
}

