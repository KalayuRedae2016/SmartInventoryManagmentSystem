'use strict';
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Purchase extends Model {
    static associate(models) {
      Purchase.belongsTo(models.Supplier, { foreignKey: "supplierId", as: "supplier" });
      // Purchase.hasMany(models.PurchaseItem, { foreignKey: "purchaseId", as: "purchaseItem" });
    }
  }

  Purchase.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      tenantId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
      warehouseId:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      supplierId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      totalAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      status:{type:DataTypes.BOOLEAN},
      paymentMethod:{type:DataTypes.STRING,Enum:{"cash","credit"}},
      due:{type:DataTypes.STRING},

    },
    {
      sequelize,
      modelName: "Purchase",
      tableName: "Purchases",
      timestamps: true,
    }
  );

  return Purchase;
};
