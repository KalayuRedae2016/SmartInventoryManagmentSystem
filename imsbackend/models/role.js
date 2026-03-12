'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.hasMany(models.User, { foreignKey: 'roleId', as: 'users' });
      Role.belongsToMany(models.Permission, { through: models.RolePermission, foreignKey: 'roleId', as: 'permissions' });
      Role.belongsTo(models.Business, { foreignKey: 'businessId', as: 'tenant' });
    }
  }
  Role.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, 
  { sequelize, modelName: 'Role', tableName: 'Roles', timestamps: true });
  return Role;
};
