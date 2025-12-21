// API Route Paths
export const API_ROUTES = {
  // Business Types
  BUSINESS_TYPES: '/business-types',
  BUSINESS_TYPE_BY_ID: '/business-types/:id',
  BUSINESS_TYPE_DISABLE: '/business-types/:id/disable',
  BUSINESS_TYPE_ENABLE: '/business-types/:id/enable',

  //Menu
  MENU_SECTIONS: '/menu/sections',

  // Inventory
  CATEGORIES: '/inventory/categories',
  CATEGORY_BY_ID: '/inventory/categories/:id',
  CATEGORY_DISABLE: '/inventory/categories/:id/disable',
  CATEGORY_ENABLE: '/inventory/categories/:id/enable',

  UNITS: '/inventory/units',
  UNIT_BY_ID: '/inventory/units/:id',
  UNIT_DISABLE: '/inventory/units/:id/disable',
  UNIT_ENABLE: '/inventory/units/:id/enable',

  BRANDS: '/inventory/brands',
  BRAND_BY_ID: '/inventory/brands/:id',
  BRAND_DISABLE: '/inventory/brands/:id/disable',
  BRAND_ENABLE: '/inventory/brands/:id/enable',

  STORES: '/inventory/stores',
  STORE_BY_ID: '/inventory/stores/:id',
  STORE_DISABLE: '/inventory/stores/:id/disable',
  STORE_ENABLE: '/inventory/stores/:id/enable',
  STORES_LOGIN: '/inventory/stores/login',


  MAKES: '/inventory/makes',
  MAKE_BY_ID: '/inventory/makes/:id',
  MAKE_DISABLE: '/inventory/makes/:id/disable',
  MAKE_ENABLE: '/inventory/makes/:id/enable',

  PRODUCTS: '/inventory/products',
  PRODUCT_BY_ID: '/inventory/products/:id',
  PRODUCT_DISABLE: '/inventory/products/:id/disable',
  PRODUCT_ENABLE: '/inventory/products/:id/enable',

  SUPPLIERS: '/inventory/suppliers',
  SUPPLIER_BY_ID: '/inventory/suppliers/:id',
  SUPPLIER_DELETE: '/inventory/suppliers/:id',

  PURCHASE_BILLS: '/inventory/purchase-bills',
  PURCHASE_BILL_BY_ID: '/inventory/purchase-bills/:id',
  SUPPLIER_PRODUCTS: '/inventory/suppliers/:supplierId/products',
  PRODUCT_PRICE_HISTORY: '/inventory/products/:productId/price-history',

  CUSTOMERS: '/inventory/customers',
  CUSTOMER_SEARCH: '/inventory/customers/search',



  // Authentication
  AUTH: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',

  // Admin Authentication
  ADMIN_LOGIN: '/admin/login',
  ADMIN_REGISTER: '/admin/register',

  // Users
  USERS: '/users',
  USER_BY_ID: '/users/:id',
  USER_PROFILE: '/users/profile',

  // Tenant Users
  TENANT_USERS: '/tenant-users',
  TENANT_USER_BY_ID: '/tenant-users/:id',

  // Tenant Profile
  TENANT_PROFILE: '/tenant/profile',

  // Health Check
  HEALTH: '/health'
}

// Response Messages
export const MESSAGES = {
  // Business Type Messages
  BUSINESS_TYPE_NOT_FOUND: 'Business type not found',
  BUSINESS_TYPE_EXISTS: 'Business type already exists',
  BUSINESS_TYPE_CREATED: 'Business type created successfully',
  BUSINESS_TYPE_UPDATED: 'Business type updated successfully',
  BUSINESS_TYPE_DELETED: 'Business type deleted successfully',
  BUSINESS_TYPE_DISABLED: 'Business type disabled successfully',
  BUSINESS_TYPE_ENABLED: 'Business type enabled successfully',
  BUSINESS_TYPES_FETCHED: 'Business types fetched successfully',
  BUSINESS_TYPE_FETCHED: 'Business type fetched successfully',

  // Authentication Messages
  AUTH: {
    UNAUTHORIZED: 'Unauthorized access'
  },

  // Error Messages
  FETCH_ERROR: 'Failed to fetch data',
  CREATE_ERROR: 'Failed to create record',
  UPDATE_ERROR: 'Failed to update record',
  DELETE_ERROR: 'Failed to delete record',
  DISABLE_ERROR: 'Failed to disable record',
  ENABLE_ERROR: 'Failed to enable record'
}

export default {
  API_ROUTES,
  MESSAGES
}