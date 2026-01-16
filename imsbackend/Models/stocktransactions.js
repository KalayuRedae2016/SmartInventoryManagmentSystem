'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockTransaction extends Model {
    static associate(models) {
      StockTransaction.belongsTo(models.Business, { foreignKey: 'businessId', as: 'business' });
      StockTransaction.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      StockTransaction.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
      StockTransaction.belongsTo(models.User, { foreignKey: 'performedBy', as: 'user' });
    }
  }

  StockTransaction.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

      type: {
        type: DataTypes.ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST'),
        allowNull: false
      },

      quantity: { type: DataTypes.INTEGER, allowNull: false },

      referenceType: {
        type: DataTypes.ENUM('PURCHASE','SALE','RETURN','ADJUSTMENT','TRANSFER'),
        allowNull: true
      },

      referenceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      performedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      note: { type: DataTypes.STRING }
    },
    {
      sequelize,
      modelName: 'StockTransaction',
      tableName: 'StockTransactions',
      timestamps: true
    }
  );

  return StockTransaction;
};
