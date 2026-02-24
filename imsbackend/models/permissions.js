'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      Permission.belongsTo(models.Business, { foreignKey: 'businessId', as: 'business' });
      Permission.belongsToMany(models.Role, { through: models.RolePermission, foreignKey: 'permissionId', as: 'roles' });
    }
  }
  Permission.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    key: { type: DataTypes.STRING, allowNull: false },
    module: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize, modelName: 'Permission', tableName: 'Permissions', timestamps: true,
    indexes: [{ unique: true, fields: ['businessId', 'key'] }]
  });
  return Permission;
};