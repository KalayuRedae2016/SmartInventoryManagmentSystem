'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SaleReturn extends Model {
    static associate(models) {
      SaleReturn.belongsTo(models.Sale, { foreignKey: 'saleId', as: 'sale' });
      SaleReturn.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
      SaleReturn.hasMany(models.SaleReturnItem, { foreignKey: 'saleReturnId', as: 'items' });
    }
  }

  SaleReturn.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    tenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    saleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

    returnNumber: { type: DataTypes.STRING, allowNull: false },

    returnDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

    totalAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },

    refundMethod: {
      type: DataTypes.ENUM('cash','bank_transfer','wallet','credit_note'),
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM('pending','completed'),
      defaultValue: 'completed'
    },

    note: { type: DataTypes.TEXT },

    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }

  }, {
    sequelize,
    modelName: 'SaleReturn',
    tableName: 'SaleReturns',
    timestamps: true
  });

  return SaleReturn;
};
