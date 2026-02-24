'use strict';

// Fixed master permission list for RBAC. Roles are dynamic, permissions are not.
const MASTER_PERMISSIONS = Object.freeze([
  'dashboard.view',
  'system.view',
  'users.view',
  'users.create',
  'users.update',
  'users.delete',
  'roles.view',
  'roles.create',
  'roles.update',
  'roles.delete',
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'categories.view',
  'categories.create',
  'categories.update',
  'categories.delete',
  'brands.view',
  'brands.create',
  'brands.update',
  'brands.delete',
  'units.view',
  'units.create',
  'units.update',
  'units.delete',
  'warehouses.view',
  'warehouses.create',
  'warehouses.update',
  'warehouses.delete',
  'stock.view',
  'stock.history',
  'stock.transfer',
  'stock.adjust',
  'stock.approve',
  'purchases.view',
  'purchases.create',
  'purchases.update',
  'purchases.delete',
  'purchase-return.create',
  'purchase-return.approve',
  'sales.view',
  'sales.create',
  'sales.update',
  'sales.delete',
  'sale-return.create',
  'sale-return.approve',
  'customers.view',
  'customers.create',
  'customers.update',
  'customers.delete',
  'suppliers.view',
  'suppliers.create',
  'suppliers.update',
  'suppliers.delete',
  'requests.view',
  'requests.create',
  'requests.approve',
  'reports.view',
  'payment.manage'
]);

const MASTER_SET = new Set(MASTER_PERMISSIONS);

function titleFromKey(key) {
  return String(key || '')
    .split('.')
    .map(part => part.replace(/[-_]/g, ' '))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' - ');
}

function buildMasterPermissionRecords() {
  return MASTER_PERMISSIONS.map(key => ({
    key,
    name: titleFromKey(key),
    description: `${key} permission`
  }));
}

function normalizePermissions(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(p => String(p).trim()).filter(Boolean);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed.map(p => String(p).trim()).filter(Boolean) : [];
    } catch {
      return input.split(',').map(p => p.trim()).filter(Boolean);
    }
  }
  return [];
}

function invalidPermissions(permissions) {
  return normalizePermissions(permissions).filter(permission => !MASTER_SET.has(permission) && permission !== '*');
}

module.exports = {
  MASTER_PERMISSIONS,
  buildMasterPermissionRecords,
  normalizePermissions,
  invalidPermissions
};
