'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockTransfer extends Model {
    static associate(models) {
      StockTransfer.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
      StockTransfer.belongsTo(models.Warehouse, { foreignKey: 'fromWarehouseId', as: 'fromWarehouse' });
      StockTransfer.belongsTo(models.Warehouse, { foreignKey: 'toWarehouseId', as: 'toWarehouse' });
      StockTransfer.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  StockTransfer.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    fromWarehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    toWarehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    note: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'StockTransfer',
    tableName: 'StockTransfers',
    timestamps: true,
  });

  return StockTransfer;
};
