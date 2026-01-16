'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Purchases', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      supplierId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },

      totalAmount: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      paidAmount: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      dueAmount: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },

      paymentMethod: { type: Sequelize.ENUM('cash', 'credit'), defaultValue: 'cash' },
      status: { type: Sequelize.ENUM('pending', 'partial', 'paid'), defaultValue: 'pending' },

      note: { type: Sequelize.STRING },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },

      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Purchases');
  }
};
