'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SaleReturns', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      saleId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Sales', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      customerId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      totalAmount: { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      paidAmount: { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      dueAmount: { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      status: { type: Sequelize.BOOLEAN, defaultValue: true },
      paymentMethod: { type: Sequelize.ENUM('cash','bank_transfer','mobile_payment'), allowNull: false },
      returnDate: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('SaleReturns'); }
};
