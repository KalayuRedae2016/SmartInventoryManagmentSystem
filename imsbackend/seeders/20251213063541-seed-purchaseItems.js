'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('PurchaseItems', [{
      purchaseId: 1,
      businessId: 1,
      warehouseId: 1,
      productId: 1,
      quantity: 10,
      unitPrice: 50,
      total: 500,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('PurchaseItems', null, {});
  }
};
