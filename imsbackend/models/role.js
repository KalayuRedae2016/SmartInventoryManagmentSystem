'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.belongsTo(models.Business, { foreignKey: 'businessId' });
      Role.hasMany(models.User, { foreignKey: 'roleId', as: 'users' });
    }
    hasPermission(permission) { return Array.isArray(this.permissions) && (this.permissions.includes('*') || this.permissions.includes(permission)); }
  }
  Role.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    description: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'Roles',
    timestamps: true,
    indexes: [{ unique: true, fields: ['businessId', 'code'] }]
  });
  return Role;
};
