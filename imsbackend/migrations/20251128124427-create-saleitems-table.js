'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SalesItems', {
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
        onDelete: 'CASCADE' // if Sale deleted, items deleted
      },

      productId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // prevent deleting product if item exists
      },

      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      unitPrice: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(10,2), allowNull: false },

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
    await queryInterface.dropTable('SalesItems');
  }
};
