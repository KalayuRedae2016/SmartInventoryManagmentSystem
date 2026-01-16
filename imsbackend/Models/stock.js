'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    static associate(models) {
      Stock.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  Stock.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenantId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
    warehouseId:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST'), allowNull: false },
    quantity:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    referenceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    performedBy:{type:DataTypes.INTEGER.UNSIGNED,allowNull:true},
    note: { type: DataTypes.STRING, allowNull: true },
    valueDate:{type:DataTypes.STRING,defaultValue:DataTypes.NOW}
  }, {
    sequelize,
    modelName: 'Stock',
    tableName: 'Stocks',
    timestamps: true,
  });

  return Stock;
};
