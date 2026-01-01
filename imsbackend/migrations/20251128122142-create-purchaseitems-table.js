'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PurchaseItems', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      purchaseId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Purchases',  // MUST MATCH TABLE NAME
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',    // Delete items when purchase deleted
      },

      productId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Products',   // MUST MATCH TABLE NAME
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',   // Prevent deleting product with history
      },

      quantity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },

      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PurchaseItems');
  }
};
