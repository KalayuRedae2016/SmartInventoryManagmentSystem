'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.hasMany(models.User, {
        foreignKey: 'roleId',
        as: 'users'
      });
    }

    // Optional helper
    hasPermission(permission) {
      return Array.isArray(this.permissions) && this.permissions.includes(permission);
    }
  }

  Role.init({
    id: {type: DataTypes.INTEGER.UNSIGNED,autoIncrement: true,primaryKey: true},
    name: {type: DataTypes.STRING,allowNull: false,unique: true},
    code: {type: DataTypes.STRING,allowNull: false,unique: true},
    permissions: {type: DataTypes.JSON,allowNull: false,defaultValue: []},
    isActive: {type: DataTypes.BOOLEAN,defaultValue: true},
    description: {type: DataTypes.STRING},
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'Roles',
    timestamps: true
  });

  return Role;
};
