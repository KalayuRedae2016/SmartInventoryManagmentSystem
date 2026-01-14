'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  Stock.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId:{type:DataTypes.INTEGER.UNSIGNED},
      warehouseId:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      proudctId:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      name: { pe: DataTypes.STRING, allowNull: false },
      quantity:{type:DataTypes.INTEGER.UNSIGNED,default:0},
      stockAlert:{type:DataTypes.INTEGER.UNSIGNED,default:0}, 
      description: { type: DataTypes.TEXT},       
    },
    {
      sequelize,
      modelName: 'Stock',
      tableName: 'Stocks',
      timestamps: true,
    }
  );

  return Category;
};
