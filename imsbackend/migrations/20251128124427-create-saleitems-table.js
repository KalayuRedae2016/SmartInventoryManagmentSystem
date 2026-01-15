'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SaleItems', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      saleId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Sales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      tenantId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },

      warehouseId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },

      productId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      quantity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },

      unitPrice: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },

      total: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('SaleItems');
  }
};
