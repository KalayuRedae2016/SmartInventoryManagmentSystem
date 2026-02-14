'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    createPasswordResetOTP() {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      this.passwordResetOTP = otp;
      this.passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      return otp;
    }

    generateRandomPassword() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    async checkPassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    fullName: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, validate: { isEmail: true } },
    password: { type: DataTypes.STRING },
    profileImage: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    passwordResetOTP: { type: DataTypes.STRING },
    passwordResetOTPExpires: { type: DataTypes.DATE },
    changePassword: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => { if(user.password) user.password = await bcrypt.hash(user.password, 12); },
      beforeUpdate: async (user) => { if(user.changed('password')) user.password = await bcrypt.hash(user.password, 12); }
    }
  });

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
    User.belongsTo(models.Business, { foreignKey: 'businessId', as: 'tenant' });
  };

  return User;
};
