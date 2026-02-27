'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    static associate(models) {
      RolePermission.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
      RolePermission.belongsTo(models.Permission, { foreignKey: 'permissionId', as: 'permission' });
    }
  }
  RolePermission.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    permissionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
  }, {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'RolePermissions',
    timestamps: true,
    indexes: [{ unique: true, fields: ['roleId','permissionId'] }]
  });
  return RolePermission;
};