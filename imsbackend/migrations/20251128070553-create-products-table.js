'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: { 
        type: Sequelize.INTEGER.UNSIGNED, 
        autoIncrement: true, 
        primaryKey: true, 
        allowNull: false, 
        unique: true 
      },
      name: { type: Sequelize.STRING, allowNull: false },
      sku: { type: Sequelize.STRING, unique: true },
      partNumber: { type: Sequelize.STRING },
      serialTracking: { type: Sequelize.BOOLEAN, defaultValue: false },

      categoryId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'Categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      brandId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'Brands', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      unitId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'Units', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      defaultCostPrice: { type: Sequelize.FLOAT, defaultValue: 0 },
      defaultSellingPrice: { type: Sequelize.FLOAT, defaultValue: 0 },
      lastPurchaseCost: { type: Sequelize.FLOAT, defaultValue: 0 },
      minimumStock: { type: Sequelize.INTEGER, defaultValue: 0 },
      preferredCostMethod: { 
        type: Sequelize.ENUM('FIFO', 'LIFO', 'AVERAGE'), 
        defaultValue: 'AVERAGE' 
      },
      barcode: { type: Sequelize.STRING },
      images: { type: Sequelize.JSON }, // Array of image URLs
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Products');
  }
};
