import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscussionPermissions1757700000001
  implements MigrationInterface
{
  name = 'AddDiscussionPermissions1757700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add discussion-related permissions
    const permissions = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'read_discussions',
        displayName: 'Read Discussions',
        description:
          'Can read discussions and posts (granted to all users by default, can be revoked)',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'create_discussions',
        displayName: 'Create Discussions',
        description:
          'Can create new discussion threads (granted to all authenticated users by default)',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'reply_to_discussions',
        displayName: 'Reply to Discussions',
        description:
          'Can reply to discussions (granted to all authenticated users by default)',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: 'edit_own_posts',
        displayName: 'Edit Own Posts',
        description:
          'Can edit their own discussion posts (granted to all authenticated users by default)',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        name: 'edit_all_posts',
        displayName: 'Edit All Posts',
        description:
          'Can edit any discussion post (administrators only by default)',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440015',
        name: 'delete_discussions',
        displayName: 'Delete Discussions',
        description:
          'Can delete discussion threads and posts (administrators only by default)',
      },
    ];

    for (const permission of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions (id, name, displayName, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [permission.id, permission.name, permission.displayName, permission.description]
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

