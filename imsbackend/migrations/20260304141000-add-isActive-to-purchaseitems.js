'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('PurchaseItems');
    if (!table.isActive) {
      await queryInterface.addColumn('PurchaseItems', 'isActive', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('PurchaseItems');
    if (table.isActive) {
      await queryInterface.removeColumn('PurchaseItems', 'isActive');
    }
  }
};
