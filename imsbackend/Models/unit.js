'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Unit extends Model {
    static associate(models) {
      // A Unit can be assigned to many products
      Unit.hasMany(models.Product, { foreignKey: 'unitId' });
    }
  }

  Unit.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      name: {type: DataTypes.STRING,allowNull: false,unique: true,
        set(value) {
          this.setDataValue('name', value.trim());
        }
      },
      tenantId:{type:DataTypes.INTEGER.UNSIGNED},
      symbol: {type: DataTypes.STRING,allowNull: true},
      baseUnit:{type:DataTypes.STRING},
      operator:{type:DataTypes.STRING},
      operationValue:{type:DataTypes.STRING},
      description: {type: DataTypes.TEXT,allowNull: true},
      isActive: {type: DataTypes.BOOLEAN,defaultValue: true}
    },
    {
      sequelize,
      modelName: 'Unit',
      tableName: 'Units',
      timestamps: true,

      // Enable if you want soft delete:
      // paranoid: true,
      // deletedAt: 'deletedAt',
    }
  );

  return Unit;
};
