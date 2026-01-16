'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('SaleItems', [
      { saleId: 1, businessId: 1, warehouseId: 1, productId: 1, quantity: 5, unitPrice: 100, total: 500, createdAt: new Date(), updatedAt: new Date() },
      { saleId: 2, businessId: 1, warehouseId: 1, productId: 2, quantity: 3, unitPrice: 100, total: 300, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('SaleItems', null, {});
  }
};
