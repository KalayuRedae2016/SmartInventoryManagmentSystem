'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Businesses', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false
      },

      ownerName: {
        type: Sequelize.STRING,
        allowNull: false
      },

      phone: Sequelize.STRING,
      email: Sequelize.STRING,
      address: Sequelize.STRING,
      logo: Sequelize.STRING,

      subscriptionStatus: {
        type: Sequelize.ENUM('trial', 'pending', 'active', 'expired'),
        defaultValue: 'trial'
      },

      trialStart: Sequelize.DATE,
      trialEnd: Sequelize.DATE,

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Businesses');
    // await queryInterface.sequelize.query(
    //   'DROP TYPE IF EXISTS "enum_Businesses_subscriptionStatus";'
    // );
  }
};
