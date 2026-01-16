'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      Customer.hasMany(models.Sale, { foreignKey: 'customerId', as: 'sales' });
      Customer.belongsTo(models.Business, { foreignKey: 'tenantId', as: 'tenant' });
    }
  }

  Customer.init({
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
    totalSaleDue: { type: DataTypes.FLOAT, defaultValue: 0 },
    totalSalesReturnDue: { type: DataTypes.FLOAT, defaultValue: 0 },
    additionalInfo: { type: DataTypes.STRING }
  }, {
    sequelize,
    modelName: 'Customer',
    tableName: 'Customers',
    timestamps: true
  });

  return Customer;
};
