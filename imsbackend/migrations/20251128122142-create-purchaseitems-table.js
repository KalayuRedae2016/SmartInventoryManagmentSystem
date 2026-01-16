'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PurchaseItems', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      purchaseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      productId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },

      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      unitPrice: { type: Sequelize.FLOAT, allowNull: false },
      total: { type: Sequelize.FLOAT, allowNull: false },

      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },

      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PurchaseItems');
  }
};
