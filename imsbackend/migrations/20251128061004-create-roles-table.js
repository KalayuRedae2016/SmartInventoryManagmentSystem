'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Roles', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Businesses', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      name: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false },
      permissions: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      description: { type: Sequelize.STRING },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
    await queryInterface.addIndex('Roles', ['businessId', 'code'], { unique: true });
  },
  async down(queryInterface) { await queryInterface.dropTable('Roles'); }
};
