'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Customers', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      tenantId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      country: { type: Sequelize.STRING },
      city: { type: Sequelize.STRING },
      address: { type: Sequelize.STRING },
      taxNumber: { type: Sequelize.STRING },
      totalSaleDue: { type: Sequelize.FLOAT, defaultValue: 0 },
      totalSalesReturnDue: { type: Sequelize.FLOAT, defaultValue: 0 },
      additionalInfo: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Customers');
  }
};
