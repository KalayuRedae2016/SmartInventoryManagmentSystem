'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },

      fullName: { type: Sequelize.STRING, allowNull: false },

      phoneNumber: { type: Sequelize.STRING, allowNull: false, unique: true },

      email: { type: Sequelize.STRING, allowNull: true },

      password: { type: Sequelize.STRING },

      role: { type: Sequelize.ENUM('user', 'staff', 'admin'), allowNull: false },

      profileImage: { type: Sequelize.STRING },

      address: { type: Sequelize.STRING },

      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },

      passwordResetOTP: { type: Sequelize.STRING },

      passwordResetOTPExpires: { type: Sequelize.DATE },

      changePassword: { type: Sequelize.BOOLEAN, defaultValue: true },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },

      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  },
};
