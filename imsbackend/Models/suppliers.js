'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    static associate(models) {
      Supplier.hasMany(models.Purchase, { foreignKey: 'supplierId', as: 'purchases' });
    }
  }

  Supplier.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING }
    },
    {
      sequelize,
      modelName: 'Supplier',
      tableName: 'Suppliers',
      timestamps: true
    }
  );

  return Supplier;
};
