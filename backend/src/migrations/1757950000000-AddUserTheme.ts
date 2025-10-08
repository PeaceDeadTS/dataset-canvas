import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserTheme1757950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'theme',
        type: 'varchar',
        length: '20',
        default: "'system'",
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'theme');
  }
}

