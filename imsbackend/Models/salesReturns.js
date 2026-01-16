'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SaleReturn extends Model {
    static associate(models) {
      SaleReturn.belongsTo(models.Sale, { foreignKey: 'saleId', as: 'sale' });
      SaleReturn.hasMany(models.SaleReturnItem, { foreignKey: 'saleReturnId', as: 'items' });
      SaleReturn.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    }
  }

  SaleReturn.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    saleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    totalAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    paymentMethod: { type: DataTypes.ENUM('cash','bank_transfer','mobile_payment'), allowNull: false },
    returnDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { sequelize, modelName: 'SaleReturn', tableName: 'SaleReturns', timestamps: true });

  return SaleReturn;
};
