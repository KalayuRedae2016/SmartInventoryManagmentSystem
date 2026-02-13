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



// subscriptions
// -------------
// id (PK)
// tenant_id (FK)
// plan_name
// start_date
// end_date
// status ENUM('active','expired','pending')


// subscription_payments
// ---------------------
// id (PK)
// subscription_id (FK)
// amount
// payment_method
// payment_slip_url
// status ENUM('pending','approved','rejected')
// reviewed_by
// reviewed_at
