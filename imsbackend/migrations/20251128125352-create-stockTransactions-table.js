'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StockTransactions', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      tenantId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Businesses', key: 'id' },
        onDelete: 'CASCADE'
      },

      warehouseId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Warehouses', key: 'id' },
        onDelete: 'CASCADE'
      },

      productId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Products', key: 'id' },
        onDelete: 'CASCADE'
      },

      type: {
        type: Sequelize.ENUM('IN','OUT','TRANSFER','ADJUST'),
        allowNull: false
      },

      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      referenceType: {
        type: Sequelize.ENUM('PURCHASE','SALE','RETURN','ADJUSTMENT','TRANSFER'),
        allowNull: true
      },

      referenceId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },

      performedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },

      note: Sequelize.STRING,

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
    await queryInterface.dropTable('StockTransactions');
  }
};
