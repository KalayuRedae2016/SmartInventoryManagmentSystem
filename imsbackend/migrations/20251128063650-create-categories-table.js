'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Categories', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Categories');
  }
};
