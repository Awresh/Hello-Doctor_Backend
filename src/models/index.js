import sequelize from '../config/db.config.js';
import { Tenant } from './tenant/tenant.model.js';
import { TenantUser } from './tenant/tenent.user.model.js';
import { DoctorDetails } from './tenant/doctor-details.model.js';
import { User } from './users/user.model.js';
import { BusinessType } from './business/business-type.model.js';
import { Product } from './inventory/product.model.js';
import { Category } from './inventory/category.model.js';
import { Brand } from './inventory/brand.model.js';
import { Make } from './inventory/make.model.js';
import { Unit } from './inventory/unit.model.js';
import { Supplier } from './inventory/supplier.model.js';
import { Store } from './inventory/store.model.js';
import { PriceHistory } from './inventory/price-history.model.js';
import { PurchaseBill } from './inventory/purchase-bill.model.js';
import { SalesBill } from './inventory/sales-bill.model.js';
import { Section } from './menu/section.model.js';
import { MenuItem } from './menu/menu-item.model.js';
import { BaseRoute } from './menu/base-route.model.js';
import { Customer } from './inventory/customer.model.js';
import { Appointment } from './clinic/appointment.model.js';
import { TimeSlot } from './admin/time-slot.model.js';
import { ClinicSlotConfig } from './clinic/clinic-slot-config.model.js';
import { DoctorSlotConfig } from './clinic/doctor-slot-config.model.js';
import { SlotOverride } from './clinic/slot-override.model.js';
import { Admin } from './admin/admin.model.js';
import { Role } from './tenant/role.model.js';

// Define associations after all models are loaded
function setupAssociations() {
  // Tenant associations
  Tenant.belongsTo(BusinessType, { foreignKey: 'businessTypeId' });
  BusinessType.hasMany(Tenant, { foreignKey: 'businessTypeId' });

  // Tenant User associations
  TenantUser.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(TenantUser, { foreignKey: 'tenantId' });
  TenantUser.belongsTo(TenantUser, { foreignKey: 'doctorId', as: 'doctor' });
  TenantUser.hasMany(TenantUser, { foreignKey: 'doctorId', as: 'staff' });

  // Doctor Details Association
  TenantUser.hasOne(DoctorDetails, { foreignKey: 'tenantUserId', as: 'doctorDetails' });
  DoctorDetails.belongsTo(TenantUser, { foreignKey: 'tenantUserId' });

  // Product associations - SAAS Product relationships
  Product.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Product, { foreignKey: 'tenantId' });

  Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Category.hasMany(Product, { foreignKey: 'categoryId', as: 'category' });

  Category.belongsTo(Category, { as: 'parentCategory', foreignKey: 'parentCategoryId' });
  Category.hasMany(Category, { as: 'subCategories', foreignKey: 'parentCategoryId' });

  Product.belongsTo(Brand, { foreignKey: 'brandId', as: 'brand' });
  Brand.hasMany(Product, { foreignKey: 'brandId', as: 'brand' });

  Product.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });
  Unit.hasMany(Product, { foreignKey: 'unitId', as: 'unit' });

  Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
  Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'supplier' });

  // Brand associations
  Brand.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Brand, { foreignKey: 'tenantId' });
  Brand.belongsTo(Store, { foreignKey: 'storeId' });
  Store.hasMany(Brand, { foreignKey: 'storeId' });

  // Make associations
  Make.belongsTo(Store, { foreignKey: 'storeId' });
  Store.hasMany(Make, { foreignKey: 'storeId' });

  // Supplier associations
  Supplier.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Supplier, { foreignKey: 'tenantId' });
  Supplier.belongsTo(Store, { foreignKey: 'storeId' });
  Store.hasMany(Supplier, { foreignKey: 'storeId' });

  // Unit associations
  Unit.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Unit, { foreignKey: 'tenantId' });
  Unit.belongsTo(Store, { foreignKey: 'storeId' });
  Store.hasMany(Unit, { foreignKey: 'storeId' });

  // Store associations
  Store.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Store, { foreignKey: 'tenantId' });

  // Price history associations
  PriceHistory.belongsTo(Product, { foreignKey: 'productId' });
  Product.hasMany(PriceHistory, { foreignKey: 'productId' });

  PriceHistory.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(PriceHistory, { foreignKey: 'tenantId' });

  PriceHistory.belongsTo(PurchaseBill, { foreignKey: 'purchaseBillId' });
  PurchaseBill.hasMany(PriceHistory, { foreignKey: 'purchaseBillId' });

  PriceHistory.belongsTo(Tenant, { as: 'changedByTenant', foreignKey: 'changedBy' });

  // Bill associations
  PurchaseBill.belongsTo(Tenant, { foreignKey: 'tenantId' });
  PurchaseBill.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
  PurchaseBill.belongsTo(Store, { foreignKey: 'storeId' });
  Store.hasMany(PurchaseBill, { foreignKey: 'storeId' });

  SalesBill.belongsTo(Tenant, { foreignKey: 'tenantId' });
  SalesBill.belongsTo(Store, { foreignKey: 'storeId' });
  SalesBill.belongsTo(Tenant, { as: 'creator', foreignKey: 'createdBy' });

  // Menu associations


  MenuItem.belongsTo(Section, { foreignKey: 'sectionId' });
  Section.hasMany(MenuItem, { foreignKey: 'sectionId' });

  MenuItem.belongsTo(MenuItem, { as: 'parent', foreignKey: 'parentId' });
  MenuItem.hasMany(MenuItem, { as: 'children', foreignKey: 'parentId' });

  BaseRoute.belongsTo(BusinessType, { foreignKey: 'businessTypeId' });
  BusinessType.hasOne(BaseRoute, { foreignKey: 'businessTypeId' });

  // Customer associations
  Customer.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Customer, { foreignKey: 'tenantId' });
  Customer.belongsTo(Store, { foreignKey: 'storeId' });
  Store.hasMany(Customer, { foreignKey: 'storeId' });

  // Appointment associations
  Appointment.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Appointment, { foreignKey: 'tenantId' });
  Appointment.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(Appointment, { foreignKey: 'userId' });
  Appointment.belongsTo(TenantUser, { foreignKey: 'doctorId', as: 'doctor' });
  TenantUser.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });

  // Slot Configuration associations
  // Clinic Slot Config
  ClinicSlotConfig.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasOne(ClinicSlotConfig, { foreignKey: 'tenantId' });

  // Doctor Slot Config
  DoctorSlotConfig.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(DoctorSlotConfig, { foreignKey: 'tenantId' });
  DoctorSlotConfig.belongsTo(TenantUser, { foreignKey: 'doctorId', as: 'doctor' });
  TenantUser.hasOne(DoctorSlotConfig, { foreignKey: 'doctorId', as: 'slotConfig' });

  // Slot Override
  SlotOverride.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(SlotOverride, { foreignKey: 'tenantId' });
  SlotOverride.belongsTo(TenantUser, { foreignKey: 'doctorId', as: 'doctor' });
  TenantUser.hasMany(SlotOverride, { foreignKey: 'doctorId', as: 'slotOverrides' });

  // Role associations
  Role.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Role, { foreignKey: 'tenantId' });

}

export {
  sequelize,
  Tenant,
  TenantUser,
  DoctorDetails,
  User,
  Admin,
  BusinessType,
  Product,
  Category,
  Brand,
  Unit,
  Supplier,
  Store,
  PriceHistory,
  PurchaseBill,
  SalesBill,
  Section,
  MenuItem,
  BaseRoute,
  Customer,
  Appointment,
  TimeSlot,
  ClinicSlotConfig,
  DoctorSlotConfig,
  SlotOverride,
  Role,
  setupAssociations
};