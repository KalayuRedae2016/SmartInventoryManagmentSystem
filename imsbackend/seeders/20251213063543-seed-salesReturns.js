'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('SaleReturns', [
      { id: 1, saleId: 1, businessId: 1, warehouseId: 1, customerId: 1, totalAmount: 100, status: true, paymentMethod: 'cash', returnDate: new Date(), createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('SaleReturns', null, {});
  }
};
