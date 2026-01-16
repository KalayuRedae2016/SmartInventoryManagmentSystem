'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Brands', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      country: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      image: { type: Sequelize.STRING },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Brands');
  }
};
