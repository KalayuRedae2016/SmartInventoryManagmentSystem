'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalesItem extends Model {
    static associate(models) {
      // Each SalesItem belongs to a Sale
      SalesItem.belongsTo(models.Sale, { foreignKey: 'saleId', as: 'sale' });

      // Each SalesItem belongs to a Product
      SalesItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    }
  }

  SalesItem.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    saleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  }, {
    sequelize,
    modelName: 'SalesItem',
    tableName: 'SalesItems',
    timestamps: true,
  });

  return SalesItem;
};
