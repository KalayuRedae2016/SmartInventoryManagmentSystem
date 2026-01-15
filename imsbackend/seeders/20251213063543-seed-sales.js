'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Sales', [{
      tenantId: 1,
      warehouseId: 1,
      customerId: 1,
      userId: 1,
      invoiceNumber: 'INV-0001',
      saleDate: new Date(),
      totalAmount: 500,
      paidAmount: 500,
      dueAmount: 0,
      paymentMethod: 'cash',
      status: 'completed',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Sales', null, {});
  }
};
