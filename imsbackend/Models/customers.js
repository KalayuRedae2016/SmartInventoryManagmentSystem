'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      // A Customer can have many Sales
      Customer.hasMany(models.Sale, {
        foreignKey: 'customerId',
        as: 'sales',
      });
    }
  }

  Customer.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'Customers',
      timestamps: true,
    }
  );

  return Customer;
};
