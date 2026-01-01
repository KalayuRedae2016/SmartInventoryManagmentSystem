'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockTransaction extends Model {
    static associate(models) {
      StockTransaction.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  StockTransaction.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('purchase', 'sale', 'return', 'adjustment'), allowNull: false },
    referenceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    note: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'StockTransaction',
    tableName: 'StockTransactions',
    timestamps: true,
  });

  return StockTransaction;
};
