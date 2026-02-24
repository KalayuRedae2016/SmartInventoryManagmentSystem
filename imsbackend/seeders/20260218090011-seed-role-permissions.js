'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [roles] = await queryInterface.sequelize.query('SELECT id, code, permissions FROM Roles;');
    const [permissions] = await queryInterface.sequelize.query('SELECT id, `key` FROM Permissions;');
    const permissionIdByKey = new Map(permissions.map(item => [item.key, item.id]));

    const rows = [];
    for (const role of roles) {
      let rolePermissions = [];
      try {
        rolePermissions = Array.isArray(role.permissions) ? role.permissions : JSON.parse(role.permissions || '[]');
      } catch {
        rolePermissions = [];
      }

      if (role.code === 'OWNER' || rolePermissions.includes('*')) {
        for (const permission of permissions) {
          rows.push({
            roleId: role.id,
            permissionId: permission.id,
            createdAt: now,
            updatedAt: now
          });
        }
        continue;
      }

      for (const key of rolePermissions) {
        const permissionId = permissionIdByKey.get(key);
        if (!permissionId) continue;
        rows.push({
          roleId: role.id,
          permissionId,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    if (rows.length) await queryInterface.bulkInsert('RolePermissions', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('RolePermissions', null, {});
  }
};

