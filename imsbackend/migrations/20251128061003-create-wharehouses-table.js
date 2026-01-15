'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Warehouses', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      businessId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Businesses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false
      },

      code: {
        type: Sequelize.STRING,
        allowNull: false
      },

      location: Sequelize.STRING,
      managerName: Sequelize.STRING,
      phone: Sequelize.STRING,
      email: Sequelize.STRING,

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

    // Composite unique index
    await queryInterface.addIndex(
      'Warehouses',
      ['businessId', 'code'],
      { unique: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Warehouses');
  }
};
