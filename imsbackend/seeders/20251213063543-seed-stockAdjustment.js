'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('StockAdjustments', [
      { businessId: 1, warehouseId: 1, productId: 1, userId: 1, quantity: 50, adjustmentType: 'IN', note: 'Initial stock', createdAt: new Date(), updatedAt: new Date() },
      { businessId: 1, warehouseId: 1, productId: 2, userId: 1, quantity: 5, adjustmentType: 'OUT', note: 'Damaged items', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('StockAdjustments', null, {});
  }
};
