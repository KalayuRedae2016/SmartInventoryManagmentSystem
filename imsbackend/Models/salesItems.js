'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SaleItem extends Model {
    static associate(models) {
      SaleItem.belongsTo(models.Business, { foreignKey: 'businessId', as: 'business' });
      SaleItem.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      SaleItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
       SaleItem.belongsTo(models.Sale, { foreignKey: 'saleId', as: 'sale' });
    }
  }

  SaleItem.init({
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    saleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPrice: { type: DataTypes.FLOAT, allowNull: false },
    total: { type: DataTypes.FLOAT, allowNull: false }
  }, { sequelize, modelName: 'SaleItem', tableName: 'SaleItems', timestamps: true });

  return SaleItem;
};
