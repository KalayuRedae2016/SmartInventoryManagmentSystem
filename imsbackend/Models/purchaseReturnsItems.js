'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseReturnItem extends Model {
    static associate(models) {
      PurchaseReturnItem.belongsTo(models.PurchaseReturn, { foreignKey: 'purchaseReturnId' });
      PurchaseReturnItem.belongsTo(models.Product, { foreignKey: 'productId' });
    }
  }

  PurchaseReturnItem.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    purchaseReturnId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPrice: { type: DataTypes.FLOAT, allowNull: false },
    total: { type: DataTypes.FLOAT, allowNull: false }
  }, {
    sequelize,
    modelName: 'PurchaseReturnItem',
    tableName: 'PurchaseReturnItems',
    timestamps: true
  });

  return PurchaseReturnItem;
};
