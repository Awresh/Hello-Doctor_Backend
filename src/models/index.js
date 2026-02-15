import sequelize from '../config/db.config.js';
import { Tenant } from './tenant/tenant.model.js';
import { TenantUser } from './tenant/tenent.user.model.js';
import { DoctorDetails } from './tenant/doctor-details.model.js';
import { DoctorService } from './tenant/doctor-service.model.js';
import { User } from './users/user.model.js';

import { Plan } from './business/plan.model.js';
import { Subscription } from './tenant/subscription.model.js';
import { PaymentMethod } from './tenant/payment-method.model.js';
import { BillingHistory } from './tenant/billing-history.model.js';
import { PaymentMode } from './tenant/payment-mode.model.js';

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
import { Prescription } from './clinic/prescription.model.js';
import { TimeSlot } from './admin/time-slot.model.js';
import { ClinicSlotConfig } from './clinic/clinic-slot-config.model.js';
import { DoctorSlotConfig } from './clinic/doctor-slot-config.model.js';
import { SlotOverride } from './clinic/slot-override.model.js';
import { Admin } from './admin/admin.model.js';
import { Role } from './tenant/role.model.js';
import { Notification } from './notification/notification.model.js';
import { TimeSettings } from './settings/time-settings.model.js';
import { SpecialHoliday } from './settings/special-holiday.model.js';
import { CallHistory } from './tenant/call-history.model.js';
import { CallBillingHistory } from './tenant/call-billing-history.model.js';

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

  // Call History Associations
  CallHistory.belongsTo(TenantUser, { as: 'caller', foreignKey: 'callerId', constraints: false });
  CallHistory.belongsTo(TenantUser, { as: 'receiver', foreignKey: 'receiverId', constraints: false });
  CallHistory.belongsTo(Tenant, { as: 'callerTenant', foreignKey: 'callerId', constraints: false });
  CallHistory.belongsTo(Tenant, { as: 'receiverTenant', foreignKey: 'receiverId', constraints: false });
  TenantUser.hasMany(CallHistory, { as: 'outgoingCalls', foreignKey: 'callerId', constraints: false });
  TenantUser.hasMany(CallHistory, { as: 'incomingCalls', foreignKey: 'receiverId', constraints: false });

  // Call Billing History Associations
  CallBillingHistory.belongsTo(Tenant, { foreignKey: 'tenantId' });
  CallBillingHistory.belongsTo(TenantUser, { as: 'Caller', foreignKey: 'callerId' });
  CallBillingHistory.belongsTo(TenantUser, { as: 'Receiver', foreignKey: 'receiverId' });
  TenantUser.hasMany(CallBillingHistory, { as: 'outgoingBilledCalls', foreignKey: 'callerId' });
  TenantUser.hasMany(CallBillingHistory, { as: 'incomingBilledCalls', foreignKey: 'receiverId' });
  Tenant.hasMany(CallBillingHistory, { foreignKey: 'tenantId' });

  // Doctor Details Association
  TenantUser.hasOne(DoctorDetails, { foreignKey: 'tenantUserId', as: 'doctorDetails' });
  DoctorDetails.belongsTo(TenantUser, { foreignKey: 'tenantUserId' });

  // Doctor Services Association
  TenantUser.hasMany(DoctorService, { foreignKey: 'tenantUserId', as: 'assignedServices' });
  DoctorService.belongsTo(TenantUser, { foreignKey: 'tenantUserId' });

  DoctorService.belongsTo(Product, { foreignKey: 'serviceId', as: 'service' });
  DoctorService.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(DoctorService, { foreignKey: 'tenantId' });

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
  PurchaseBill.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });
  Store.hasMany(PurchaseBill, { foreignKey: 'storeId', as: 'purchaseBills' });

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
  TenantUser.belongsTo(Role, { foreignKey: 'role', as: 'userRole' });

  // Notification associations
  Notification.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Notification, { foreignKey: 'tenantId' });
  Notification.belongsTo(TenantUser, { foreignKey: 'userId', as: 'recipient' });
  TenantUser.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

  // Subscription & Billing associations
  Subscription.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasOne(Subscription, { foreignKey: 'tenantId' });

  Subscription.belongsTo(Plan, { foreignKey: 'planId' });
  Plan.hasMany(Subscription, { foreignKey: 'planId' });

  PaymentMethod.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(PaymentMethod, { foreignKey: 'tenantId' });

  BillingHistory.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(BillingHistory, { foreignKey: 'tenantId' });

  BillingHistory.belongsTo(Subscription, { foreignKey: 'subscriptionId' });
  BillingHistory.belongsTo(Subscription, { foreignKey: 'subscriptionId' });
  Subscription.hasMany(BillingHistory, { foreignKey: 'subscriptionId' });

  // Payment Mode associations
  PaymentMode.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(PaymentMode, { foreignKey: 'tenantId' });

  // Time Settings associations
  TimeSettings.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(TimeSettings, { foreignKey: 'tenantId' });

  // Special Holiday associations
  SpecialHoliday.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(SpecialHoliday, { foreignKey: 'tenantId' });

  // Prescription associations
  Prescription.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Tenant.hasMany(Prescription, { foreignKey: 'tenantId' });
  Prescription.belongsTo(Appointment, { foreignKey: 'appointmentId' });
  Appointment.hasOne(Prescription, { foreignKey: 'appointmentId' });
  Prescription.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(Prescription, { foreignKey: 'userId' });
  Prescription.belongsTo(TenantUser, { foreignKey: 'doctorId', as: 'doctor' });
  TenantUser.hasMany(Prescription, { foreignKey: 'doctorId', as: 'prescriptions' });

}

export {
  sequelize,
  Tenant,
  TenantUser,
  DoctorDetails,
  DoctorService,
  User,
  Admin,
  BusinessType,
  Product,
  Category,
  Brand,
  Make,
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
  Notification,
  Plan,
  Subscription,
  PaymentMethod,
  BillingHistory,
  PaymentMode,
  TimeSettings,
  SpecialHoliday,
  Prescription,
  CallHistory,
  CallBillingHistory,
  setupAssociations
};