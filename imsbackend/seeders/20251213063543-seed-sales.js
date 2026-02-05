'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Sales', [
      { id: 1, businessId: 1, warehouseId: 1, customerId: 1, invoiceNumber: 'INV-001', totalAmount: 500, paymentMethod: 'cash', status: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, businessId: 1, warehouseId: 1, customerId: 2, invoiceNumber: 'INV-002', totalAmount: 300, paymentMethod: 'bank_transfer', status: true, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Sales', null, {});
  }
};
