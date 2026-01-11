import express from 'express';
import { API_ROUTES } from '../config/serverConfig.js';
import CategoryController from '../controllers/inventory/category.controller.js';
import UnitController from '../controllers/inventory/unit.controller.js';
import BrandController from '../controllers/inventory/brand.controller.js';
import StoreController from '../controllers/inventory/store.controller.js';
import MakeController from '../controllers/inventory/make.controller.js';

import ProductController from '../controllers/inventory/product.controller.js';
import SupplierController from "../controllers/inventory/supplier.controller.js";
import PurchaseBillController from "../controllers/inventory/purchase-bill.controller.js";
import { createSalesBill, getAllSalesBills } from '../controllers/inventory/sales-bill.controller.js';
import { getDashboardStats } from '../controllers/inventory/dashboard.controller.js';

const router = express.Router();

// Dashboard
router.get('/inventory/dashboard', getDashboardStats);

// Sales Bills
router.post('/inventory/sales-bills', createSalesBill);
router.get('/inventory/sales-bills', getAllSalesBills);
router.get('/sells', getAllSalesBills);  // Alias
router.get('/sales', getAllSalesBills); // Alias

// Customers
import { createCustomer, searchCustomers } from '../controllers/inventory/customer.controller.js';
router.post(API_ROUTES.CUSTOMERS, createCustomer);
router.get(API_ROUTES.CUSTOMER_SEARCH, searchCustomers);

// --- Categories ---
router.get(API_ROUTES.CATEGORIES, CategoryController.getAllCategories);
router.get(API_ROUTES.CATEGORY_BY_ID, CategoryController.getCategoryById);
router.post(API_ROUTES.CATEGORIES, CategoryController.createCategory);
router.patch(API_ROUTES.CATEGORY_BY_ID, CategoryController.updateCategory);
router.delete(API_ROUTES.CATEGORY_BY_ID, CategoryController.deleteCategory);
router.patch(API_ROUTES.CATEGORY_DISABLE, CategoryController.disableCategory);
router.patch(API_ROUTES.CATEGORY_ENABLE, CategoryController.enableCategory);

// --- Units ---
router.get(API_ROUTES.UNITS, UnitController.getAllUnits);
router.get(API_ROUTES.UNIT_BY_ID, UnitController.getUnitById);
router.post(API_ROUTES.UNITS, UnitController.createUnit);
router.patch(API_ROUTES.UNIT_BY_ID, UnitController.updateUnit);
router.delete(API_ROUTES.UNIT_BY_ID, UnitController.deleteUnit);
router.patch(API_ROUTES.UNIT_DISABLE, UnitController.disableUnit);
router.patch(API_ROUTES.UNIT_ENABLE, UnitController.enableUnit);

// --- Brands ---
router.get(API_ROUTES.BRANDS, BrandController.getAllBrands);
router.get(API_ROUTES.BRAND_BY_ID, BrandController.getBrandById);
router.post(API_ROUTES.BRANDS, BrandController.createBrand);
router.patch(API_ROUTES.BRAND_BY_ID, BrandController.updateBrand);
router.delete(API_ROUTES.BRAND_BY_ID, BrandController.deleteBrand);
router.patch(API_ROUTES.BRAND_DISABLE, BrandController.disableBrand);
router.patch(API_ROUTES.BRAND_ENABLE, BrandController.enableBrand);

// --- Products ---
router.get(API_ROUTES.PRODUCTS, ProductController.getAllProducts);
router.get(API_ROUTES.PRODUCT_BY_ID, ProductController.getProductById);
router.post(API_ROUTES.PRODUCTS, ProductController.createProduct);
router.patch(API_ROUTES.PRODUCT_BY_ID, ProductController.updateProduct);
router.delete(API_ROUTES.PRODUCT_BY_ID, ProductController.deleteProduct);
router.patch(API_ROUTES.PRODUCT_DISABLE, ProductController.disableProduct);
router.patch(API_ROUTES.PRODUCT_ENABLE, ProductController.enableProduct);

// --- Suppliers ---
router.get(API_ROUTES.SUPPLIERS, SupplierController.getAll);
router.post(API_ROUTES.SUPPLIERS, SupplierController.create);
router.patch(API_ROUTES.SUPPLIER_BY_ID, SupplierController.update);
router.delete(API_ROUTES.SUPPLIER_DELETE, SupplierController.delete);

// --- Stores ---
router.get(API_ROUTES.STORES, StoreController.getAllStores);
router.get(API_ROUTES.STORE_BY_ID, StoreController.getStoreById);
import { checkLimit } from '../middleware/limit.middleware.js';

router.post(API_ROUTES.STORES, checkLimit('stores'), StoreController.createStore);
router.patch(API_ROUTES.STORE_BY_ID, StoreController.updateStore);
router.delete(API_ROUTES.STORE_BY_ID, StoreController.deleteStore);
router.patch(API_ROUTES.STORE_DISABLE, StoreController.disableStore);
router.patch(API_ROUTES.STORE_ENABLE, StoreController.enableStore);
router.post(API_ROUTES.STORES_LOGIN, StoreController.loginStore);

// --- Purchase Bills ---
router.get(API_ROUTES.PURCHASE_BILLS, PurchaseBillController.getAllPurchaseBills);
router.get(API_ROUTES.PURCHASE_BILL_BY_ID, PurchaseBillController.getPurchaseBillById);
router.post(API_ROUTES.PURCHASE_BILLS, PurchaseBillController.createPurchaseBill);
router.patch(API_ROUTES.PURCHASE_BILL_BY_ID, PurchaseBillController.updatePurchaseBill);
router.delete(API_ROUTES.PURCHASE_BILL_BY_ID, PurchaseBillController.deletePurchaseBill);
router.post(`${API_ROUTES.PURCHASE_BILL_BY_ID}/payments`, PurchaseBillController.addPayment);
router.get(API_ROUTES.SUPPLIER_PRODUCTS, PurchaseBillController.getProductsBySupplier);
router.get(API_ROUTES.PRODUCT_PRICE_HISTORY, PurchaseBillController.getPriceHistory);

// --- Makes ---
router.get(API_ROUTES.MAKES, MakeController.getAllMakes);
router.get(API_ROUTES.MAKE_BY_ID, MakeController.getMakeById);
router.post(API_ROUTES.MAKES, MakeController.createMake);
router.patch(API_ROUTES.MAKE_BY_ID, MakeController.updateMake);
router.delete(API_ROUTES.MAKE_BY_ID, MakeController.deleteMake);
router.patch(API_ROUTES.MAKE_DISABLE, MakeController.disableMake);
router.patch(API_ROUTES.MAKE_ENABLE, MakeController.enableMake);

export default router;
