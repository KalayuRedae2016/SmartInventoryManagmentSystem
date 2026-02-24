'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserPermissions', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      permissionId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Permissions', key: 'id' }, onDelete: 'CASCADE' },
      granted: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('UserPermissions', ['userId', 'permissionId'], { unique: true });
  },
  async down(queryInterface) { await queryInterface.dropTable('UserPermissions'); }
};