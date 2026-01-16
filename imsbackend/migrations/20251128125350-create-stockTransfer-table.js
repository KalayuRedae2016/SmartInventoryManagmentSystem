'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StockTransfers', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      businessId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      fromWarehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Warehouses', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      toWarehouseId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Warehouses', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      productId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      userId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      note: { type: Sequelize.STRING, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('StockTransfers');
  }
};
