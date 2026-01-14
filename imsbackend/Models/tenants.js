
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    static associate(models) {
      // Warehouse.hasMany(models.Stock, { foreignKey: 'warehouseId' });
      // Warehouse.hasMany(models.StockTransaction, { foreignKey: 'warehouseId' });
      // Warehouse.hasMany(models.Purchase, { foreignKey: 'warehouseId' });
      // Warehouse.hasMany(models.Sale, { foreignKey: 'warehouseId' });
    }
  }

  Warehouse.init(
    {
      id: {type: DataTypes.INTEGER.UNSIGNED,autoIncrement: true,primaryKey: true},
      businessName: {type: DataTypes.STRING,allowNull: false,unique: true},
      ownerName:{type: DataTypes.STRING,allowNull: false,unique: true},
      location: {type: DataTypes.STRING,allowNull: true},
      phone: {type: DataTypes.STRING,allowNull: true},
      email: {type: DataTypes.STRING,allowNull: true},
      logo: {type: DataTypes.STRING,allowNull: false,unique: true},
      subscription_status:{type:DataTypes.STRING,ENUM('trial','pending','active','expired')},
      trial_start:{type:DataTypes.STRING},
      trial_end:{type:DataTypes.STRING},
      
      isActive: {type: DataTypes.BOOLEAN,defaultValue: true},
      },
    {
      sequelize,
      modelName: 'Tenant',
      tableName: 'Tenants',
      timestamps: true
    }
  );

  return Tenants;
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
