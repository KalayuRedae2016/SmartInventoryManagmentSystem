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
      id: {type: DataTypes.INTEGER.UNSIGNED,autoIncrement: true,primaryKey: true},
      tenantId:{type:DataTypes.INTEGER.UNSIGNED},
      code: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      country:{type:DataTypes.STRING},
      city:{type:DataTypes.STRING},
      address: { type: DataTypes.STRING },
      taxNumber:{type:DataTypes.STRING},
      totalSaleDue:{type:DataTypes.INTEGER},
      totalSalesReturnDue:{type:DataTypes},
      additionalInfo:{type:DataTypes.STRING}

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
