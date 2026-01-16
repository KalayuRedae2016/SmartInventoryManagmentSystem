'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('StockTransfers', [
      { businessId: 1, fromWarehouseId: 1, toWarehouseId: 2, productId: 1, userId: 1, quantity: 20, note: 'Rebalance stock', createdAt: new Date(), updatedAt: new Date() },
      { businessId: 1, fromWarehouseId: 2, toWarehouseId: 1, productId: 2, userId: 1, quantity: 10, note: 'Return transfer', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('StockTransfers', null, {});
  }
};
