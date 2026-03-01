'use strict';

const { Op } = require('sequelize');

class QueryHelper { constructor(req, baseWhere = {}) {
    this.req = req;
    this.query = req.query;
    this.where = { ...baseWhere };
  }

  // ================= DATE FILTER =================
  dateFilter(field = 'createdAt') {
    const { startDate, endDate } = this.query;

    if (startDate && endDate) {
      this.where[field] = {
        [Op.between]: [
          new Date(startDate),
          new Date(endDate)
        ]
      };
    }

    return this;
  }

  // ================= GENERIC FILTER =================
  addFilter(field) {
    if (this.query[field]) {
      this.where[field] = this.query[field];
    }
    return this;
  }

  // ================= MULTI FIELD FILTER =================
  addMultipleFilters(fields = []) {
    fields.forEach(field => {
      if (this.query[field]) {
        this.where[field] = this.query[field];
      }
    });
    return this;
  }

  // ================= SEARCH =================
  search(fields = []) {
    if (this.query.search) {
      this.where[Op.or] = fields.map(field => ({
        [field]: { [Op.like]: `%${this.query.search}%` }
      }));
    }
    return this;
  }

  // ================= BUSINESS ISOLATION =================
  restrictToBusiness(user) {
    if (user.businessId) {
      this.where.businessId = user.businessId;
    }
    return this;
  }

  // ================= PAGINATION =================
  paginate() {
    const page = parseInt(this.query.page) || 1;
    const limit = parseInt(this.query.limit) || 10;
    const offset = (page - 1) * limit;

    return { limit, offset, page };
  }

  // ================= SORTING =================
  sort(defaultField = 'createdAt') {
    const sortBy = this.query.sortBy || defaultField;
    const order = this.query.order === 'ASC' ? 'ASC' : 'DESC';

    return [[sortBy, order]];
  }

  // ================= EXPORT MODE =================
  isExport() {
    return this.query.export === 'pdf' || this.query.export === 'excel';
  }

  build() {
    return this.where;
  }
}

module.exports = QueryHelper;