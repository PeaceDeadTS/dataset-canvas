import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Миграция для выдачи базовых привилегий существующим пользователям
 * 
 * Выдает следующие базовые привилегии всем обычным пользователям (не администраторам):
 * - read_discussions
 * - create_discussions  
 * - reply_to_discussions
 * - edit_own_posts
 * 
 * Администраторы имеют все права автоматически и не нуждаются в явном назначении
 */
export class GrantDefaultPermissions1757900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Получаем ID привилегий, которые нужно выдать
    const permissions = await queryRunner.query(`
      SELECT id, name FROM permissions 
      WHERE name IN ('read_discussions', 'create_discussions', 'reply_to_discussions', 'edit_own_posts')
    `);

    if (permissions.length === 0) {
      console.log('No default permissions found in database. Skipping migration.');
      return;
    }

    // Получаем всех обычных пользователей (не администраторов)
    const users = await queryRunner.query(`
      SELECT id, username, role FROM users 
      WHERE role != 'Administrator'
    `);

    if (users.length === 0) {
      console.log('No non-admin users found. Skipping migration.');
      return;
    }

    console.log(`Found ${users.length} non-admin users and ${permissions.length} default permissions`);

    // Для каждого пользователя выдаем все базовые привилегии (если они еще не выданы)
    for (const user of users) {
      for (const permission of permissions) {
        // Проверяем, нет ли уже этой привилегии у пользователя
        const existing = await queryRunner.query(`
          SELECT * FROM user_permissions 
          WHERE userId = ? AND permissionId = ?
        `, [user.id, permission.id]);

        if (existing.length === 0) {
          // Выдаем привилегию
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
    // Откат миграции: удаляем базовые привилегии у всех пользователей
    console.log('Rolling back default permissions migration...');
    
    // Получаем ID базовых привилегий
    const permissions = await queryRunner.query(`
      SELECT id, name FROM permissions 
      WHERE name IN ('read_discussions', 'create_discussions', 'reply_to_discussions', 'edit_own_posts')
    `);

    if (permissions.length === 0) {
      console.log('No default permissions found. Nothing to roll back.');
      return;
    }

    const permissionIds = permissions.map((p: any) => p.id);

    // Удаляем связи для всех пользователей
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

