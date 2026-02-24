'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    static associate() {}
  }

  RolePermission.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      permissionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
    },
    {
      sequelize,
      modelName: 'RolePermission',
      tableName: 'RolePermissions',
      timestamps: true,
      indexes: [{ unique: true, fields: ['roleId', 'permissionId'] }]
    }
  );

  return RolePermission;
};

