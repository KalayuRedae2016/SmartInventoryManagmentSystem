'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PurchaseReturnItems', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      purchaseReturnId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      productId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },

      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      unitPrice: { type: Sequelize.FLOAT, allowNull: false },
      total: { type: Sequelize.FLOAT, allowNull: false },

      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PurchaseReturnItems');
  }
};
