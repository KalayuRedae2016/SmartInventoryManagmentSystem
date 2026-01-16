'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseReturn extends Model {
    static associate(models) {
      PurchaseReturn.belongsTo(models.Purchase, { foreignKey: 'purchaseId', as: 'purchase' });
      PurchaseReturn.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
      PurchaseReturn.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
    }
  }

  PurchaseReturn.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    purchaseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    supplierId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    totalAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    reason: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('pending', 'completed'), defaultValue: 'completed' },

    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'PurchaseReturn',
    tableName: 'PurchaseReturns',
    timestamps: true
  });

  return PurchaseReturn;
};
