'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('SaleItems', [{
      saleId: 1,
      tenantId: 1,
      warehouseId: 1,
      productId: 1,
      quantity: 5,
      unitPrice: 100,
      total: 500,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('SaleItems', null, {});
  }
};
