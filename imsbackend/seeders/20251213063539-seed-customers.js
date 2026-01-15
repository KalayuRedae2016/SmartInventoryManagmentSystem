'use strict';
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('Customers', [
      {
        tenantId: 1,
        code: 'CUST001',
        name: 'John Doe Enterprises',
        phone: '1112223333',
        email: 'contact@johndoe.com',
        country: 'USA',
        city: 'New York',
        address: '100 Wall Street',
        taxNumber: 'TAX10001',
        totalSaleDue: 0,
        totalSalesReturnDue: 0,
        additionalInfo: 'VIP customer',
        createdAt: now,
        updatedAt: now
      },
      {
        tenantId: 1,
        code: 'CUST002',
        name: 'Acme Corp',
        phone: '4445556666',
        email: 'sales@acmecorp.com',
        country: 'USA',
        city: 'Los Angeles',
        address: '200 Tech Blvd',
        taxNumber: 'TAX10002',
        totalSaleDue: 0,
        totalSalesReturnDue: 0,
        additionalInfo: 'New customer',
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Customers', null, {});
  }
};
