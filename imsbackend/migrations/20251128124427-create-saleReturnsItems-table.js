'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SaleReturnItems', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      saleReturnId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'SaleReturns', key: 'id' },
        onDelete: 'CASCADE'
      },

      tenantId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },

      productId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Products', key: 'id' }
      },

      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },

      unitPrice: { type: Sequelize.DECIMAL(10,2), allowNull: false },

      total: { type: Sequelize.DECIMAL(10,2), allowNull: false },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('SaleReturnItems');
  }
};
