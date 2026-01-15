'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('SaleReturnItems', [
      { saleReturnId: 1, tenantId: 1, warehouseId: 1, productId: 1, quantity: 1, unitPrice: 100, total: 100, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('SaleReturnItems', null, {});
  }
};
