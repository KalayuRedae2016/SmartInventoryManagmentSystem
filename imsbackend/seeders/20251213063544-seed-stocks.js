'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Stocks', [
      { businessId: 1, warehouseId: 1, productId: 1, quantity: 100, stockAlert: 10, description: 'Initial stock', createdAt: new Date(), updatedAt: new Date() },
      { businessId: 1, warehouseId: 1, productId: 2, quantity: 50, stockAlert: 5, description: 'Initial stock', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Stocks', null, {});
  }
};
