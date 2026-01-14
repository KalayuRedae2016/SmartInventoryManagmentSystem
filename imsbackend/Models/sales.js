'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    static associate(models) {
      // Each Sale can have many SalesItems
      Sale.hasMany(models.SalesItem, { foreignKey: 'saleId', as: 'salesItems' });

      // Each Sale belongs to a Customer
      Sale.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });

      // Each Sale belongs to a User
      Sale.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Sale.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      tenantId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
      warehouseId:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      customerId: {type: DataTypes.INTEGER.UNSIGNED,allowNull: true},
      invoiceNumber: {type: DataTypes.STRING,allowNull: false},
      saleDate: {type: DataTypes.DATE,defaultValue: DataTypes.NOW},
      totalAmount: {type: DataTypes.DECIMAL(10, 2),allowNull: false},
      paymentMethod:{type:DataTypes.STRING,ENum: ['cash','bank_transfer','mobile_payment'],allowNull:false},
      userId: {type: DataTypes.INTEGER.UNSIGNED,allowNull: false},
      status:{type:DataTypes.BOOLEAN},
      due:{type:DataTypes.STRING},
    },
    {
      sequelize,
      modelName: 'Sale',
      tableName: 'Sales',
      timestamps: true
    }
  );

  return Sale;
};
