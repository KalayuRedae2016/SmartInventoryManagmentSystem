'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create RolePermissions after Roles and Permissions tables exist
    await queryInterface.createTable('RolePermissions', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      roleId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'Roles', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      permissionId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'Permissions', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('RolePermissions', ['roleId', 'permissionId'], { unique: true });
  },
  async down(queryInterface) { await queryInterface.dropTable('RolePermissions'); }
};