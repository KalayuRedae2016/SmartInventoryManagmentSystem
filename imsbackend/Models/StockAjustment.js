'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockAdjustment extends Model {
    static associate(models) {
      StockAdjustment.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
      StockAdjustment.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      StockAdjustment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  StockAdjustment.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    adjustmentType: { type: DataTypes.ENUM('IN','OUT'), allowNull: false },
    note: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'StockAdjustment',
    tableName: 'StockAdjustments',
    timestamps: true,
  });

  return StockAdjustment;
};
