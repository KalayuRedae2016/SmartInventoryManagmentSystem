'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    static associate(models) {
      Sale.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
      Sale.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      Sale.belongsTo(models.Business, { foreignKey: 'businessId', as: 'business' });
      Sale.hasMany(models.SaleItem, { foreignKey: 'saleId', as: 'items', onDelete: 'CASCADE' });
      Sale.hasMany(models.SaleReturn, { foreignKey: 'saleId', as: 'saleReturns' });
    }
  }

  Sale.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      saleDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      paidAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      dueAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      paymentMethod: { type: DataTypes.ENUM('cash', 'bank_transfer', 'mobile_payment'), allowNull: true },
      status: { type: DataTypes.ENUM('pending', 'partial', 'paid'), allowNull: false, defaultValue: 'pending' },
      note: { type: DataTypes.STRING, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'Sale',
      tableName: 'Sales',
      timestamps: true,
      indexes: [
        { fields: ['businessId'] },
        { fields: ['warehouseId'] },
        { fields: ['customerId'] },
        { fields: ['saleDate'] },
        { fields: ['invoiceNumber'] },
      ],
    }
  );

  return Sale;
};
