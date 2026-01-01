'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: 'categoryId' });
      Product.belongsTo(models.Brand, { foreignKey: 'brandId' });
      Product.belongsTo(models.Unit, { foreignKey: 'unitId' });

      Product.hasMany(models.PurchaseItem, { foreignKey: 'productId' });
      Product.hasMany(models.SalesItem, { foreignKey: 'productId' });
      // You can add more relations if needed: ProductStock, StockTransaction
    }
  }

  Product.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      sku: { type: DataTypes.STRING, unique: true },
      partNumber: { type: DataTypes.STRING },
      serialTracking: { type: DataTypes.BOOLEAN, defaultValue: false },
      categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      brandId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      unitId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      defaultCostPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
      defaultSellingPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
      lastPurchaseCost: { type: DataTypes.FLOAT, defaultValue: 0 },
      minimumStock: { type: DataTypes.INTEGER, defaultValue: 0 },
      preferredCostMethod: { type: DataTypes.ENUM('FIFO', 'LIFO', 'AVERAGE'), defaultValue: 'AVERAGE' },
      barcode: { type: DataTypes.STRING },
      images: { type: DataTypes.JSON },// Array of image URLs
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'Products',
      timestamps: true,
    }
  );

  return Product;
};
