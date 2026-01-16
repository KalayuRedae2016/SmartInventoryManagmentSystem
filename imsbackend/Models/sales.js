'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    static associate(models) {
      Sale.hasMany(models.SaleItem, { foreignKey: 'saleId', as: 'saleItems' });
      Sale.hasMany(models.SaleReturn, { foreignKey: 'saleId', as: 'saleReturns' });
      Sale.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
      Sale.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Sale.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    saleDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    totalAmount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    paymentMethod: { type: DataTypes.ENUM('cash','bank_transfer','mobile_payment'), allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    due: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 }
  }, { sequelize, modelName: 'Sale', tableName: 'Sales', timestamps: true });

  return Sale;
};
