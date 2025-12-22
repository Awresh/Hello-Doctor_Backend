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
import { verifyToken as authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Sales Bills
router.post('/inventory/sales-bills', authenticateUser, createSalesBill);
router.get('/inventory/sales-bills', authenticateUser, getAllSalesBills);

// Customers
import { createCustomer, searchCustomers } from '../controllers/inventory/customer.controller.js';
router.post(API_ROUTES.CUSTOMERS, authenticateUser, createCustomer);
router.get(API_ROUTES.CUSTOMER_SEARCH, authenticateUser, searchCustomers);

// --- Categories ---
router.get(API_ROUTES.CATEGORIES, authenticateUser, CategoryController.getAllCategories);
router.get(API_ROUTES.CATEGORY_BY_ID, authenticateUser, CategoryController.getCategoryById);
router.post(API_ROUTES.CATEGORIES, authenticateUser, CategoryController.createCategory);
router.patch(API_ROUTES.CATEGORY_BY_ID, authenticateUser, CategoryController.updateCategory);
router.delete(API_ROUTES.CATEGORY_BY_ID, authenticateUser, CategoryController.deleteCategory);
router.patch(API_ROUTES.CATEGORY_DISABLE, authenticateUser, CategoryController.disableCategory);
router.patch(API_ROUTES.CATEGORY_ENABLE, authenticateUser, CategoryController.enableCategory);

// --- Units ---
router.get(API_ROUTES.UNITS, authenticateUser, UnitController.getAllUnits);
router.get(API_ROUTES.UNIT_BY_ID, authenticateUser, UnitController.getUnitById);
router.post(API_ROUTES.UNITS, authenticateUser, UnitController.createUnit);
router.patch(API_ROUTES.UNIT_BY_ID, authenticateUser, UnitController.updateUnit);
router.delete(API_ROUTES.UNIT_BY_ID, authenticateUser, UnitController.deleteUnit);
router.patch(API_ROUTES.UNIT_DISABLE, authenticateUser, UnitController.disableUnit);
router.patch(API_ROUTES.UNIT_ENABLE, authenticateUser, UnitController.enableUnit);

// --- Brands ---
router.get(API_ROUTES.BRANDS, authenticateUser, BrandController.getAllBrands);
router.get(API_ROUTES.BRAND_BY_ID, authenticateUser, BrandController.getBrandById);
router.post(API_ROUTES.BRANDS, authenticateUser, BrandController.createBrand);
router.patch(API_ROUTES.BRAND_BY_ID, authenticateUser, BrandController.updateBrand);
router.delete(API_ROUTES.BRAND_BY_ID, authenticateUser, BrandController.deleteBrand);
router.patch(API_ROUTES.BRAND_DISABLE, authenticateUser, BrandController.disableBrand);
router.patch(API_ROUTES.BRAND_ENABLE, authenticateUser, BrandController.enableBrand);

// --- Products ---
router.get(API_ROUTES.PRODUCTS, authenticateUser, ProductController.getAllProducts);
router.get(API_ROUTES.PRODUCT_BY_ID, authenticateUser, ProductController.getProductById);
router.post(API_ROUTES.PRODUCTS, authenticateUser, ProductController.createProduct);
router.patch(API_ROUTES.PRODUCT_BY_ID, authenticateUser, ProductController.updateProduct);
router.delete(API_ROUTES.PRODUCT_BY_ID, authenticateUser, ProductController.deleteProduct);
router.patch(API_ROUTES.PRODUCT_DISABLE, authenticateUser, ProductController.disableProduct);
router.patch(API_ROUTES.PRODUCT_ENABLE, authenticateUser, ProductController.enableProduct);

// --- Suppliers ---
router.get(API_ROUTES.SUPPLIERS, authenticateUser, SupplierController.getAll);
router.post(API_ROUTES.SUPPLIERS, authenticateUser, SupplierController.create);
router.patch(API_ROUTES.SUPPLIER_BY_ID, authenticateUser, SupplierController.update);
router.delete(API_ROUTES.SUPPLIER_DELETE, authenticateUser, SupplierController.delete);

// --- Stores ---
router.get(API_ROUTES.STORES, authenticateUser, StoreController.getAllStores);
router.get(API_ROUTES.STORE_BY_ID, authenticateUser, StoreController.getStoreById);
router.post(API_ROUTES.STORES, authenticateUser, StoreController.createStore);
router.patch(API_ROUTES.STORE_BY_ID, authenticateUser, StoreController.updateStore);
router.delete(API_ROUTES.STORE_BY_ID, authenticateUser, StoreController.deleteStore);
router.patch(API_ROUTES.STORE_DISABLE, authenticateUser, StoreController.disableStore);
router.patch(API_ROUTES.STORE_ENABLE, authenticateUser, StoreController.enableStore);
router.post(API_ROUTES.STORES_LOGIN, authenticateUser, StoreController.loginStore);

// --- Purchase Bills ---
router.get(API_ROUTES.PURCHASE_BILLS, authenticateUser, PurchaseBillController.getAllPurchaseBills);
router.get(API_ROUTES.PURCHASE_BILL_BY_ID, authenticateUser, PurchaseBillController.getPurchaseBillById);
router.post(API_ROUTES.PURCHASE_BILLS, authenticateUser, PurchaseBillController.createPurchaseBill);
router.patch(API_ROUTES.PURCHASE_BILL_BY_ID, authenticateUser, PurchaseBillController.updatePurchaseBill);
router.delete(API_ROUTES.PURCHASE_BILL_BY_ID, authenticateUser, PurchaseBillController.deletePurchaseBill);
router.post(`${API_ROUTES.PURCHASE_BILL_BY_ID}/payments`, authenticateUser, PurchaseBillController.addPayment);
router.get(API_ROUTES.SUPPLIER_PRODUCTS, PurchaseBillController.getProductsBySupplier);
router.get(API_ROUTES.PRODUCT_PRICE_HISTORY, PurchaseBillController.getPriceHistory);

// --- Makes ---
router.get(API_ROUTES.MAKES, authenticateUser, MakeController.getAllMakes);
router.get(API_ROUTES.MAKE_BY_ID, authenticateUser, MakeController.getMakeById);
router.post(API_ROUTES.MAKES, authenticateUser, MakeController.createMake);
router.patch(API_ROUTES.MAKE_BY_ID, authenticateUser, MakeController.updateMake);
router.delete(API_ROUTES.MAKE_BY_ID, authenticateUser, MakeController.deleteMake);
router.patch(API_ROUTES.MAKE_DISABLE, authenticateUser, MakeController.disableMake);
router.patch(API_ROUTES.MAKE_ENABLE, authenticateUser, MakeController.enableMake);

export default router;
