'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SaleReturns', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      tenantId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Businesses', key: 'id' }
      },

      warehouseId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Warehouses', key: 'id' }
      },

      saleId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Sales', key: 'id' },
        onDelete: 'RESTRICT'
      },

      customerId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'Customers', key: 'id' },
        onDelete: 'SET NULL'
      },

      returnNumber: { type: Sequelize.STRING, allowNull: false },

      returnDate: { type: Sequelize.DATE },

      totalAmount: { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },

      refundMethod: {
        type: Sequelize.ENUM('cash','bank_transfer','wallet','credit_note')
      },

      status: {
        type: Sequelize.ENUM('pending','completed'),
        defaultValue: 'completed'
      },

      note: { type: Sequelize.TEXT },

      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });

    await queryInterface.addIndex('SaleReturns', ['tenantId', 'returnNumber'], {
      unique: true
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('SaleReturns');
  }
};
