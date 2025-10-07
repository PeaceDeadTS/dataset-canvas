import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscussionPermissions1757700000001
  implements MigrationInterface
{
  name = 'AddDiscussionPermissions1757700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add discussion-related permissions
    const permissions = [
      {
        name: 'read_discussions',
        description:
          'Can read discussions and posts (granted to all users by default, can be revoked)',
      },
      {
        name: 'create_discussions',
        description:
          'Can create new discussion threads (granted to all authenticated users by default)',
      },
      {
        name: 'reply_to_discussions',
        description:
          'Can reply to discussions (granted to all authenticated users by default)',
      },
      {
        name: 'edit_own_posts',
        description:
          'Can edit their own discussion posts (granted to all authenticated users by default)',
      },
      {
        name: 'edit_all_posts',
        description:
          'Can edit any discussion post (administrators only by default)',
      },
      {
        name: 'delete_discussions',
        description:
          'Can delete discussion threads and posts (administrators only by default)',
      },
    ];

    for (const permission of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions (name, description) VALUES (?, ?)`,
        [permission.name, permission.description]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove discussion-related permissions
    await queryRunner.query(
      `DELETE FROM permissions WHERE name IN ('read_discussions', 'create_discussions', 'reply_to_discussions', 'edit_own_posts', 'edit_all_posts', 'delete_discussions')`
    );
  }
}

