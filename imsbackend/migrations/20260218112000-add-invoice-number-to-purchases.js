'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Purchases');
    if (!table.invoiceNumber) {
      await queryInterface.addColumn('Purchases', 'invoiceNumber', {
        type: Sequelize.STRING,
        allowNull: true
      });
      await queryInterface.addIndex('Purchases', ['invoiceNumber'], { unique: true });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('Purchases');
    if (table.invoiceNumber) {
      await queryInterface.removeIndex('Purchases', ['invoiceNumber']);
      await queryInterface.removeColumn('Purchases', 'invoiceNumber');
    }
  }
};

