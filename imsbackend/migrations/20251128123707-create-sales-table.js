'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sales', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      customerId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      invoiceNumber: { type: Sequelize.STRING, allowNull: false, unique: true },
      saleDate: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      totalAmount: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      paidAmount: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      dueAmount: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      paymentMethod: { type: Sequelize.ENUM('cash','bank_transfer','mobile_payment'), allowNull: false },
      status: { type: Sequelize.BOOLEAN, defaultValue: true },
      note: { type: Sequelize.STRING, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('Sales'); }
};
