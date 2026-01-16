'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Business, { foreignKey: 'businessId', as: 'business' });
      Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
      Product.belongsTo(models.Brand, { foreignKey: 'brandId', as: 'brand' });
      Product.belongsTo(models.Unit, { foreignKey: 'unitId', as: 'unit' });
    }
  }

  Product.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    sku: { type: DataTypes.STRING, unique: true },
    partNumber: { type: DataTypes.STRING },
    serialTracking: { type: DataTypes.BOOLEAN, defaultValue: false },
    categoryId: { type: DataTypes.INTEGER.UNSIGNED },
    brandId: { type: DataTypes.INTEGER.UNSIGNED },
    unitId: { type: DataTypes.INTEGER.UNSIGNED },
    defaultCostPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
    defaultSellingPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
    lastPurchaseCost: { type: DataTypes.FLOAT, defaultValue: 0 },
    minimumStock: { type: DataTypes.INTEGER, defaultValue: 0 },
    preferredCostMethod: { type: DataTypes.ENUM('FIFO','LIFO','AVERAGE'), defaultValue: 'AVERAGE' },
    barcode: { type: DataTypes.STRING },
    images: { type: DataTypes.JSON },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products',
    timestamps: true
  });

  return Product;
};
