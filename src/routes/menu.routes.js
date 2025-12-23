import express from 'express'
import menuController from '../controllers/menu/menu.controllers.js'
import { API_ROUTES } from '../config/serverConfig.js'
const router = express.Router()
import { verifyToken as authenticateUser } from '../middleware/auth.middleware.js';


// ============================================
// BASE ROUTE MANAGEMENT
// ============================================

/**
 * @route   POST /api/menu/base-route
 * @desc    Set base route for business type
 * @body    { businessType, baseRoute }
 */
router.post('/base-route', authenticateUser, menuController.setBaseRoute);

/**
 * @route   GET /api/menu/base-routes
 * @desc    Get all base routes
 */
router.get('/base-routes', authenticateUser, menuController.getAllBaseRoutes);

// ============================================
// SECTION MANAGEMENT
// ============================================

/**
 * @route   POST /api/menu/sections
 * @desc    Create new section
 * @body    { businessType, sectionId, label, type, order }
 */
router.post('/sections', authenticateUser, menuController.createSection);

/**
 * @route   GET /api/menu/sections/:businessType
 * @desc    Get all sections for a business type
 */
router.get('/sections/:businessType', authenticateUser, menuController.getSectionsByBusinessType);

/**
 * @route   GET /api/menu/section/:id
 * @desc    Get section by ID
 */
router.get('/section/:id', authenticateUser, menuController.getSectionById);

/**
 * @route   PUT /api/menu/section/:id
 * @desc    Update section
 */
router.put('/section/:id', authenticateUser, menuController.updateSection);

/**
 * @route   DELETE /api/menu/section/:id
 * @desc    Delete section
 */
router.delete('/section/:id', menuController.deleteSection);

// ============================================
// MENU SIDEBAR FORMAT
// ============================================

/**
 * @route   GET /api/menu/sidebar
 * @desc    Get menu in sidebarService format (with sections and baseRoute)
 * @query   userRole - optional
 */
router.get('/sidebar', menuController.getMenuForSidebar);

// ============================================
// MENU ITEM CRUD
// ============================================

/**
 * @route   POST /api/menu/item
 * @desc    Create new menu item
 * @body    { sectionRef, title, icon, path, parentId, order, allowedRoles }
 */
router.post('/item', menuController.createMenuItem);

/**
 * @route   GET /api/menu/items/section/:sectionId
 * @desc    Get all menu items for a section
 */
router.get('/items/section/:sectionId', menuController.getMenuItemsBySection);

/**
 * @route   GET /api/menu/item/:id
 * @desc    Get single menu item by ID
 */
router.get('/item/:id', authenticateUser, menuController.getMenuItemById);

/**
 * @route   PUT /api/menu/item/:id
 * @desc    Update menu item
 */
router.put('/item/:id', authenticateUser, menuController.updateMenuItem);

/**
 * @route   DELETE /api/menu/item/:id
 * @desc    Delete menu item
 */
router.delete('/item/:id', authenticateUser, menuController.deleteMenuItem);

export default router
