'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SaleItem extends Model {
    static associate(models) {
      SaleItem.belongsTo(models.Sale, { foreignKey: 'saleId', as: 'sale' });
      SaleItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  SaleItem.init({
    saleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPrice: { type: DataTypes.FLOAT, allowNull: false },
    total: { type: DataTypes.FLOAT, allowNull: false }
  }, { sequelize, modelName: 'SaleItem', tableName: 'SaleItems', timestamps: true });

  return SaleItem;
};
