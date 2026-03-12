'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseReturnItem extends Model {
    static associate(models) {
      PurchaseReturnItem.belongsTo(models.PurchaseReturn, { foreignKey: 'purchaseReturnId',as:'purchaseReturn' });
      PurchaseReturnItem.belongsTo(models.Product, { foreignKey: 'productId',as:'product' });
      PurchaseReturnItem.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
    }
  }

  PurchaseReturnItem.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    purchaseReturnId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
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
