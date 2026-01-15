'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PurchaseReturns', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      tenantId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      purchaseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      supplierId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },

      totalAmount: { type: Sequelize.FLOAT, defaultValue: 0 },
      reason: { type: Sequelize.STRING },
      status: { type: Sequelize.STRING },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },

      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PurchaseReturns');
  }
};
