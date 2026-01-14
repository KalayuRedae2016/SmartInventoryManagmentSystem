'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockAdjustment extends Model {
    static associate(models) {
      StockAdjustment.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  StockAdjustment.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenantId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
    warehouseId:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    status:{type:DataTypes.ENUM,values:['in','out'],allowNull:false}, 
    note: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'StockAdjustment',
    tableName: 'StockAdjustments',
    timestamps: true,
  });

  return StockAdjustment;
};
