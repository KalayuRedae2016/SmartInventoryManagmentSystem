'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Stocks', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      warehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Warehouses', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      productId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      name: { type: Sequelize.STRING, allowNull: false },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      stockAlert: { type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0 },
      description: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Stocks');
  }
};
