'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Purchase extends Model {
    static associate(models) {
      Purchase.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
      Purchase.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      Purchase.belongsTo(models.Business, { foreignKey: 'businessId', as: 'business' });
    }
  }

  Purchase.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    supplierId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    totalAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    paidAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    dueAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },

    paymentMethod: { type: DataTypes.ENUM('cash', 'credit'), allowNull: false, defaultValue: 'cash' },
    status: { type: DataTypes.ENUM('pending', 'partial', 'paid'), defaultValue: 'pending' },

    note: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Purchase',
    tableName: 'Purchases',
    timestamps: true
  });

  return Purchase;
};
