'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    static associate(models) {
      // Warehouse.hasMany(models.Stock, { foreignKey: 'warehouseId' });
      // Warehouse.hasMany(models.StockTransaction, { foreignKey: 'warehouseId' });
      // Warehouse.hasMany(models.Purchase, { foreignKey: 'warehouseId' });
      // Warehouse.hasMany(models.Sale, { foreignKey: 'warehouseId' });
    }
  }

  Warehouse.init(
    {
      id: {type: DataTypes.INTEGER.UNSIGNED,autoIncrement: true,primaryKey: true},

      name: {type: DataTypes.STRING,allowNull: false,unique: true},

      code: {type: DataTypes.STRING,allowNull: false,unique: true},

      location: {type: DataTypes.STRING,allowNull: true},

      phone: {type: DataTypes.STRING,allowNull: true},
      email: {type: DataTypes.STRING,allowNull: true},
      managerName: {type: DataTypes.STRING,allowNull: true},
      isActive: {type: DataTypes.BOOLEAN,defaultValue: true},
      },
    {
      sequelize,
      modelName: 'Warehouse',
      tableName: 'Warehouses',
      timestamps: true
    }
  );

  return Warehouse;
};
