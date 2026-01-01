'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {

  class User extends Model {
    createPasswordResetOTP() {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      this.passwordResetOTP = otp;
      this.passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
      return otp;
    }

    generateRandomPassword() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const length = 8;
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      fullName: { type: DataTypes.STRING, allowNull: false },
      phoneNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      email: { type: DataTypes.STRING, validate: { isEmail: true } },
      password: { type: DataTypes.STRING },
      role: { type: DataTypes.ENUM('user', 'staff', 'admin'), allowNull: false },
      profileImage: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      passwordResetOTP: { type: DataTypes.STRING },
      passwordResetOTPExpires: { type: DataTypes.DATE },
      changePassword: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      timestamps: true,
    }
  );

  return User;
};
