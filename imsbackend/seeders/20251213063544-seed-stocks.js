'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Stocks', [
      { tenantId: 1, warehouseId: 1, productId: 1, name: 'Product A', quantity: 100, stockAlert: 10, description: 'Initial stock', createdAt: new Date(), updatedAt: new Date() },
      { tenantId: 1, warehouseId: 1, productId: 2, name: 'Product B', quantity: 50, stockAlert: 5, description: 'Initial stock', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Stocks', null, {});
  }
};
