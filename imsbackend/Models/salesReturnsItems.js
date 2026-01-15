'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SaleReturnItem extends Model {
    static associate(models) {
      SaleReturnItem.belongsTo(models.SaleReturn, { foreignKey: 'saleReturnId', as: 'saleReturn' });
      SaleReturnItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  SaleReturnItem.init({
    saleReturnId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPrice: { type: DataTypes.FLOAT, allowNull: false },
    total: { type: DataTypes.FLOAT, allowNull: false }
  }, { sequelize, modelName: 'SaleReturnItem', tableName: 'SaleReturnItems', timestamps: true });

  return SaleReturnItem;
};
