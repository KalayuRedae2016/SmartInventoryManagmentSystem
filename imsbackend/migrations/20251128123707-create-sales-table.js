'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sales', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      tenantId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Businesses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      warehouseId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      customerId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'Customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      invoiceNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },

      saleDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      totalAmount: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0
      },

      paidAmount: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0
      },

      dueAmount: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0
      },

      paymentMethod: {
        type: Sequelize.ENUM('cash','bank_transfer','mobile_payment','credit'),
        allowNull: false
      },

      status: {
        type: Sequelize.ENUM('pending','completed','cancelled'),
        defaultValue: 'completed'
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Composite uniqueness per tenant
    await queryInterface.addIndex('Sales', ['tenantId', 'invoiceNumber'], {
      unique: true,
      name: 'unique_invoice_per_tenant'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Sales');
  }
};
