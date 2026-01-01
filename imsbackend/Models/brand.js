'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Brand extends Model {
    static associate(models) {
      Brand.hasMany(models.Product, { 
        foreignKey: 'brandId',
        as: 'products'
      });
    }
  }

  Brand.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      name: { 
        type: DataTypes.STRING, 
        allowNull: false 
      },
      country: { 
        type: DataTypes.STRING 
      },
      description: { 
        type: DataTypes.TEXT 
      },
      isActive: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
      },
    },
    {
      sequelize,
      modelName: 'Brand',
      tableName: 'Brands',
      timestamps: true,
    }
  );

  return Brand;
};
