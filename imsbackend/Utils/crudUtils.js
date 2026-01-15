const { Op } = require('sequelize');

const buildSearchQuery = (search, searchableFields = []) => {
  if (!search || !searchableFields.length) return {};

  return {
    [Op.or]: searchableFields.map(field => ({
      [field]: { [Op.like]: `%${search}%` }
    }))
  };
};

exports.createOne = (Model) => async (req, res, next) => {
    const item = await Model.create(req.body);
    res.status(200).json({ status: 1, item: item });
};


exports.bulkCreate = (Model) => async (req, res, next) => {
  try {
    const data = await Model.bulkCreate(req.body, { validate: true });
    res.status(201).json({ status: 1, count: data.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL WITH PAGINATION, SEARCH, SORT
 */
exports.getAll = (Model, options = {}) => async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
      search,
      status
    } = req.query;

    const where = {
      ...(status !== undefined && { isActive: status === 'active' }),
      ...buildSearchQuery(search, options.searchableFields)
    };

    const result = await Model.findAndCountAll({
      where,
      limit: +limit,
      offset: (page - 1) * limit,
      order: [[sortBy, order]],
      include: options.include || []
    });

    res.json({
      status: 1,
      total: result.count,
      page: +page,
      pages: Math.ceil(result.count / limit),
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ONE BY ID
 */
exports.getOne = (Model, options = {}) => async (req, res, next) => {
  try {
    const data = await Model.findByPk(req.params.id, {
      include: options.include || []
    });

    if (!data) {
      return res.status(404).json({ status: 0, message: 'Record not found' });
    }

    res.json({ status: 1, data });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE ONE
 */
exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const [updated] = await Model.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ status: 0, message: 'Record not found' });
    }

    res.json({ status: 1, message: 'Updated successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE ONE (HARD DELETE)
 */
exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    const deleted = await Model.destroy({
      where: { id: req.params.id }
    });

    if (!deleted) {
      return res.status(404).json({ status: 0, message: 'Record not found' });
    }

    res.json({ status: 1, message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
};


exports.toggleStatus = (Model) => async (req, res, next) => {
  try {
    const record = await Model.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ status: 0, message: 'Record not found' });
    }

    record.isActive = !record.isActive;
    await record.save();

    res.json({
      status: 1,
      message: `Status changed to ${record.isActive ? 'Active' : 'Inactive'}`
    });
  } catch (err) {
    next(err);
  }
};
