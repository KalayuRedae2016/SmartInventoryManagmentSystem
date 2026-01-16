const db = require('../Models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {sendWelcomeEmail,emailBusinessDetail} = require('../utils/emailUtils');
const Tenant = db.Business;
const Warehouse = db.Warehouse;
const Stock = db.Stock;
const User = db.User;

console.log("Databases are loaded",db);

exports.createTenant = catchAsync(async (req, res, next) => {
  const {name,ownerName,phone,email,address,logo}=req.body;
  
  if (!name || !ownerName||!phone||!email||!address) {
    return next(new AppError('fill all business required fields', 400));
  }

  const existtenant=await Tenant.findOne({where:{name,email}});
  if (existtenant) return next(new AppError('Tenant with same name or email already exists',409));

  const business = await Tenant.create({
      name,
      ownerName,
      phone,
      email,
      address,
      logo,
      subscriptionStatus: 'trial',
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 14 days trial
      isActive: true
    },
  );
  const newUser = await User.create({
    fullName: ownerName,
    phoneNumber: phone,
    role: 'business_owner',
    email:email,
    address:address,
    password: await bcrypt.hash(phone, 12),
    profileImage: logo,
  });

const defaultwarehouse=await Warehouse.create({
  name: `${name} Main Warehouse`,
  location: address,
  phone: phone,
  managerName: ownerName,
  businessId: newUser.businessId,
});

await emailBusinessDetail(newUser);

res.status(200).json({
  status: 'success',
  status:1,
  message:"New Bussiness created successfully",
  data:business,
  warehouse: defaultwarehouse
});
});

exports.getAllTenants = catchAsync(async (req, res) => {
  const {isActive,search,sortBy = 'createdAt', sortOrder = 'DESC',page = 1,limit = 20} = req.query;

  const whereQuery = {};

  if (isActive !== undefined) {
    whereQuery.isActive = ['true', '1'].includes(isActive);
  }

  if (search) {
    whereQuery[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { ownerName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { address: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortColumns = ['createdAt', 'updatedAt', 'name', 'ownerName', 'email', 'phone', 'address'];
  const orderColumn = validSortColumns.includes(sortBy)
    ? sortBy
    : 'createdAt';

  const offset = (page - 1) * limit;

  const { rows, count } = await Tenant.findAndCountAll({
    where: whereQuery,
    limit: Number(limit),
    offset,
    order: [[orderColumn, sortOrder === 'asc' ? 'ASC' : 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    total: count,
    page: Number(page),
    pages: Math.ceil(count / limit),
    results: rows.length,
    item:rows
  });
});

exports.deleteAllTenants = catchAsync(async (req, res) => {
  await Tenant.destroy({ where: {} });
  res.status(204).json({ status: 'success' });
});

exports.gettenantById = catchAsync(async (req, res, next) => {
  const tenant = await Tenant.findByPk(req.params.tenantId);
  if (!tenant) return next(new AppError('Tenant not found', 404));
  res.status(200).json({
    status: 'success',
    data: tenant,
  });
});

exports.updateTenant = catchAsync(async (req, res, next) => {
  const tenant = await Tenant.findByPk(req.params.tenantId);
  if (!tenant) return next(new AppError('Tenant not found', 404));  
  const allowedFields = ['name', 'ownerName', 'phone', 'email', 'address', 'logo', 'isActive'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    } 
  });
  await tenant.update(updates);
  res.status(200).json({
    status: 'success',
    data: tenant,
  });
} );

exports.updateBusinessStatus = async (req, res, next) => {
    const { action } = req.body;
    const businessId = req.params.id;

    if (!['activate', 'expire', 'disable'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    const business = await Tenant.findByPk(businessId);

    if (!business) return next(new AppError('Tenant not found', 404));
      

    switch (action) {
      case 'activate':
        business.subscriptionStatus = 'active';
        business.isActive = true;
        business.trialEnd = null;
        break;

      case 'expire':
        business.subscriptionStatus = 'expired';
        business.isActive = false;
        break;

      case 'disable':
        business.isActive = false;
        break;
    }

    await business.save();

    return res.status(200).json({
      success: true,
      message: `Business ${action}d successfully`,
      data: business
    });
};

exports.deleteTenant = catchAsync(async (req, res, next) => {
  const tenant = await Tenant.findByPk(req.params.tenantId);
  if (!tenant) return next(new AppError('Tenant not found', 404));  
  await tenant.destroy();
  res.status(204).json({ status: 'success' });
});

