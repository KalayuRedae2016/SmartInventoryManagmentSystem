'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      roleId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      fullName: { type: Sequelize.STRING, allowNull: false },
      phoneNumber: { type: Sequelize.STRING, allowNull: false, unique: true },
      email: { type: Sequelize.STRING },
      password: { type: Sequelize.STRING },
      profileImage: { type: Sequelize.STRING },
      address: { type: Sequelize.STRING },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      passwordResetOTP: { type: Sequelize.STRING },
      passwordResetOTPExpires: { type: Sequelize.DATE },
      changePassword: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Users');
  }
};
