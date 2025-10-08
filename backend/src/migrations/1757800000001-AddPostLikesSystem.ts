import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostLikesSystem1757800000001 implements MigrationInterface {
  name = 'AddPostLikesSystem1757800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create post_likes table
    await queryRunner.query(`
      CREATE TABLE \`post_likes\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` uuid NOT NULL,
        \`postId\` int NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_POST_LIKE_USER\` (\`userId\`),
        INDEX \`IDX_POST_LIKE_POST\` (\`postId\`),
        UNIQUE INDEX \`UQ_USER_POST_LIKE\` (\`userId\`, \`postId\`),
        CONSTRAINT \`FK_POST_LIKE_USER\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_POST_LIKE_POST\` FOREIGN KEY (\`postId\`) REFERENCES \`discussion_posts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`post_likes\``);
  }
}

