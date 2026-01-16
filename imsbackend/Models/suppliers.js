'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    static associate(models) {
      Supplier.hasMany(models.Purchase, { foreignKey: 'supplierId', as: 'purchases' });
      Supplier.belongsTo(models.Business, { foreignKey: 'tenantId', as: 'tenant' });
    }
  }

  Supplier.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, validate: { isEmail: true } },
    country: { type: DataTypes.STRING },
    city: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    taxNumber: { type: DataTypes.STRING },
    totalPurchaseDue: { type: DataTypes.FLOAT, defaultValue: 0 },
    totalPurchaseReturnDue: { type: DataTypes.FLOAT, defaultValue: 0 },
    additionalInfo: { type: DataTypes.STRING }
  }, {
    sequelize,
    modelName: 'Supplier',
    tableName: 'Suppliers',
    timestamps: true
  });

  return Supplier;
};
