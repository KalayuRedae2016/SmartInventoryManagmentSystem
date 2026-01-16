'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    static associate(models) {
      Warehouse.belongsTo(models.Business, {foreignKey: 'tenantId'});
      Warehouse.hasMany(models.Stock, {foreignKey: 'warehouseId'});
      Warehouse.hasMany(models.StockTransaction, {foreignKey: 'warehouseId'});  
    }
  }

  Warehouse.init(
    {
      id: {type: DataTypes.INTEGER.UNSIGNED,autoIncrement: true, primaryKey: true},
      businessId: {type: DataTypes.INTEGER.UNSIGNED,allowNull: false},

      name: {type: DataTypes.STRING,allowNull: false},
      code: {type: DataTypes.STRING,allowNull: false},
  
      location: DataTypes.STRING,
      managerName: DataTypes.STRING,
      phone: DataTypes.STRING,
      email: DataTypes.STRING,

      isActive: {type: DataTypes.BOOLEAN,defaultValue: true}
    },
    {
      sequelize,
      modelName: 'Warehouse',
      tableName: 'Warehouses',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['businessId', 'code']
        }
      ]
    }
  );

  return Warehouse;
};
