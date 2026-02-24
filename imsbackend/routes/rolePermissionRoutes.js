const express=require("express")
const app = express();
const router=express.Router()

const rolePermissionController = require('../controllers/rolePermissionController');
const { authenticationJwt, requirePermission } = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


router.route('/')
  .post(requirePermission('role:update'), rolePermissionController.assignPermissionsToRole)
  .delete(requirePermission('role:update'), rolePermissionController.removePermissionFromRole);

router.route('/:roleId')
  .get(requirePermission('role:view'), rolePermissionController.getRolePermissions);

module.exports = router;

module.exports=router