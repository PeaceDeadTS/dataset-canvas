import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to grant default permissions to existing users
 * 
 * Grants the following default permissions to all regular users (non-administrators):
 * - read_discussions
 * - create_discussions  
 * - reply_to_discussions
 * - edit_own_posts
 * 
 * Administrators have all permissions automatically and don't need explicit grants
 */
export class GrantDefaultPermissions1757900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get IDs of permissions to grant
    const permissions = await queryRunner.query(`
      SELECT id, name FROM permissions 
      WHERE name IN ('read_discussions', 'create_discussions', 'reply_to_discussions', 'edit_own_posts')
    `);

    if (permissions.length === 0) {
      console.log('No default permissions found in database. Skipping migration.');
      return;
    }

    // Get all regular users (non-administrators)
    const users = await queryRunner.query(`
      SELECT id, username, role FROM users 
      WHERE role != 'Administrator'
    `);

    if (users.length === 0) {
      console.log('No non-admin users found. Skipping migration.');
      return;
    }

    console.log(`Found ${users.length} non-admin users and ${permissions.length} default permissions`);

    // For each user, grant all default permissions (if not already granted)
    for (const user of users) {
      for (const permission of permissions) {
        // Check if user already has this permission
        const existing = await queryRunner.query(`
          SELECT * FROM user_permissions 
          WHERE userId = ? AND permissionId = ?
        `, [user.id, permission.id]);

        if (existing.length === 0) {
          // Grant permission
          await queryRunner.query(`
            INSERT INTO user_permissions (userId, permissionId) 
            VALUES (?, ?)
          `, [user.id, permission.id]);
          
          console.log(`Granted permission '${permission.name}' to user '${user.username}'`);
        } else {
          console.log(`User '${user.username}' already has permission '${permission.name}'`);
        }
      }
    }

    console.log('Default permissions migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Migration rollback: remove default permissions from all users
    console.log('Rolling back default permissions migration...');
    
    // Get IDs of default permissions
    const permissions = await queryRunner.query(`
      SELECT id, name FROM permissions 
      WHERE name IN ('read_discussions', 'create_discussions', 'reply_to_discussions', 'edit_own_posts')
    `);

    if (permissions.length === 0) {
      console.log('No default permissions found. Nothing to roll back.');
      return;
    }

    const permissionIds = permissions.map((p: any) => p.id);

    // Remove permission associations for all users
    for (const permission of permissions) {
      const result = await queryRunner.query(`
        DELETE FROM user_permissions 
        WHERE permissionId = ?
      `, [permission.id]);
      
      console.log(`Removed permission '${permission.name}' from all users`);
    }

    console.log('Default permissions rollback completed');
  }
}

