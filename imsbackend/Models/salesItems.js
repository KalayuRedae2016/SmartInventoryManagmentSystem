'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SaleItem extends Model {
    static associate(models) {
      SaleItem.belongsTo(models.Sale, { foreignKey: 'saleId' });
      SaleItem.belongsTo(models.Product, { foreignKey: 'productId' });
    }
  }

  SaleItem.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    saleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    total: { type: DataTypes.DECIMAL(10,2), allowNull: false }

  }, {
    sequelize,
    modelName: 'SaleItem',
    tableName: 'SaleItems',
    timestamps: true
  });

  return SaleItem;
};
