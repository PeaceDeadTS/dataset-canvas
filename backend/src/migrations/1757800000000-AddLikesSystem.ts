import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLikesSystem1757800000000 implements MigrationInterface {
  name = 'AddLikesSystem1757800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create likes table
    await queryRunner.query(`
      CREATE TABLE \`likes\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` varchar(36) NOT NULL,
        \`datasetId\` varchar(36) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_LIKE_USER\` (\`userId\`),
        INDEX \`IDX_LIKE_DATASET\` (\`datasetId\`),
        UNIQUE INDEX \`UQ_USER_DATASET_LIKE\` (\`userId\`, \`datasetId\`),
        CONSTRAINT \`FK_LIKE_USER\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_LIKE_DATASET\` FOREIGN KEY (\`datasetId\`) REFERENCES \`datasets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`likes\``);
  }
}

