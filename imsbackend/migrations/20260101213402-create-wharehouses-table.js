'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Warehouses', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      location: {
        type: Sequelize.STRING,
        allowNull: true
      },

      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },

      managerName: {
        type: Sequelize.STRING,
        allowNull: true
      },

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
    await queryInterface.dropTable('Warehouses');
  }
};
