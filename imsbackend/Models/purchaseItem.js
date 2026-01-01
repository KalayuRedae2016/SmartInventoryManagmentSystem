'use strict';
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PurchaseItem extends Model {
    static associate(models) {
      PurchaseItem.belongsTo(models.Purchase, { foreignKey: "purchaseId", as: "purchase" });
      PurchaseItem.belongsTo(models.Product, { foreignKey: "productId", as: "product" });
    }
  }

  PurchaseItem.init(
    {
      purchaseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      price: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
      sequelize,
      modelName: "PurchaseItem",
      tableName: "PurchaseItems",
      timestamps: true,
    }
  );

  return PurchaseItem;
};
