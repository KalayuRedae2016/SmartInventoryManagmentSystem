exports.buildFilter = (query, allowedFields = []) => {

  const where = {};

  allowedFields.forEach(field => {
    if (query[field] !== undefined) {
      where[field] = query[field];
    }
  });

  if (query.startDate && query.endDate) {
    where.createdAt = {
      [Op.between]: [
        new Date(query.startDate),
        new Date(query.endDate)
      ]
    };
  }

  return where;
};