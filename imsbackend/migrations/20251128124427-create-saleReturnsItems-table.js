'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SaleReturnItems', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      saleReturnId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'SaleReturns', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      productId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      unitPrice: { type: Sequelize.FLOAT, allowNull: false },
      total: { type: Sequelize.FLOAT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('SaleReturnItems'); }
};
