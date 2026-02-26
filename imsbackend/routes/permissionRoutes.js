const express=require("express")
const app = express();
const router=express.Router()

const permissionController = require('../controllers/permissionController');
const { authenticationJwt, requirePermission } = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

router.use(authenticationJwt);

router.route('/')
  .post(requirePermission('permission:create'), permissionController.createPermission)
  .get(requirePermission('permission:view'), permissionController.getPermissions)
  // .delete(requirePermission('permission:delete'), permissionController.deleteAllPermission);

router.route('/:permissionId')
  .get(requirePermission('permission:view'), permissionController.getPermission)
  .patch(requirePermission('permission:update'), permissionController.updatePermission)
  .delete(requirePermission('permission:delete'), permissionController.deletePermission);

module.exports = router;
