'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserPermission extends Model {
    static associate(models) {
      UserPermission.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      UserPermission.belongsTo(models.Permission, { foreignKey: 'permissionId', as: 'permission' });
    }
  }
  UserPermission.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    permissionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    granted: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize, modelName: 'UserPermission', tableName: 'UserPermissions', timestamps: true,
    indexes: [{ unique: true, fields: ['userId', 'permissionId'] }]
  });
  return UserPermission;
};