'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Business extends Model {
    static associate(models) {
      Business.hasMany(models.Warehouse, { foreignKey: 'businessId' });
      Business.hasMany(models.User, { foreignKey: 'businessId' });
    }
  }

  Business.init(
    {
      id: {type: DataTypes.INTEGER.UNSIGNED,autoIncrement: true,primaryKey: true},
      name: {type: DataTypes.STRING,allowNull: false},
      ownerName: {type: DataTypes.STRING,allowNull: false},
      phone: DataTypes.STRING,
      email: DataTypes.STRING,
      address: DataTypes.STRING,
      logo: DataTypes.STRING,
      subscriptionStatus: {type: DataTypes.ENUM('trial', 'pending', 'active', 'expired'),defaultValue: 'trial'},
      trialStart: DataTypes.DATE,
      trialEnd: DataTypes.DATE,
      isActive: {type: DataTypes.BOOLEAN,defaultValue: true}
    },
    {
      sequelize,
      modelName: 'Business',
      tableName: 'Businesses',
      timestamps: true
    }
  );

  return Business;
};

