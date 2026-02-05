'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    static associate(models) {
      Stock.belongsTo(models.Business, {foreignKey: 'businessId',as: 'business',});
      Stock.belongsTo(models.Warehouse, {foreignKey: 'warehouseId',as: 'warehouse',});
      Stock.belongsTo(models.Product, {foreignKey: 'productId',as: 'product',});
    }
  }

  Stock.init(
    {
      id: {type: DataTypes.INTEGER.UNSIGNED,autoIncrement: true,primaryKey: true},
      businessId: {type: DataTypes.INTEGER.UNSIGNED,allowNull: false},
      warehouseId: {type: DataTypes.INTEGER.UNSIGNED,allowNull: false},
      productId: {type: DataTypes.INTEGER.UNSIGNED,allowNull: false},
      quantity: {type: DataTypes.INTEGER,allowNull: false,defaultValue: 0},
      stockAlert: {type: DataTypes.INTEGER.UNSIGNED,defaultValue: 0},
      description: {type: DataTypes.TEXT,allowNull: true},
    },
    {
      sequelize,
      modelName: 'Stock',
      tableName: 'Stocks',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['businessId', 'warehouseId', 'productId'],
        },
      ],
    }
  );

  return Stock;
};
