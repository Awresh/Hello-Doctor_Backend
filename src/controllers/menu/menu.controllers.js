import { Section, MenuItem, BaseRoute } from '../../models/menu/menu.model.js';
import { BusinessType } from '../../models/index.js';
import { MESSAGES } from '../../config/serverConfig.js';
import { sendResponse } from '../../utils/response.util.js';
import { STATUS_CODES } from '../../config/statusCodes.js';
import { Op } from 'sequelize';
import { logDebug } from '../../utils/WebUtils.js';

// ============================================
// BASE ROUTE MANAGEMENT
// ============================================

const setBaseRoute = async (req, res) => {
  try {
    const { businessType, baseRoute } = req.body;

    const [baseRouteRecord, created] = await BaseRoute.findOrCreate({
      where: { businessTypeId: businessType },
      defaults: { businessTypeId: businessType, baseRoute }
    });

    if (!created) {
      await baseRouteRecord.update({ baseRoute });
    }

    return sendResponse(res, {
      statusCode: created ? STATUS_CODES.CREATED : STATUS_CODES.OK,
      message: created ? 'Base route created successfully' : 'Base route updated successfully',
      data: baseRouteRecord
    });
  } catch (error) {
    console.error('Error setting base route:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.CREATE_ERROR
    });
  }
};

const getAllBaseRoutes = async (req, res) => {
  try {
    const baseRoutes = await BaseRoute.findAll({
      where: { isActive: true },
      include: [{ model: BusinessType, attributes: ['name'] }]
    });

    return sendResponse(res, {
      message: 'Base routes fetched successfully',
      data: baseRoutes
    });
  } catch (error) {
    console.error('Error fetching base routes:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR
    });
  }
};

// ============================================
// SECTION MANAGEMENT
// ============================================

const createSection = async (req, res) => {
  try {
    const { businessType, sectionId, label, type, order, allowedRoles } = req.body;

    const businessTypeArray = Array.isArray(businessType) ? businessType : [businessType];

    // Generate sectionId from label if not provided
    let finalSectionId = sectionId;
    if (!finalSectionId && label) {
      finalSectionId = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Upsert Section based on sectionId and potentially businessTypeId
    // Since businessTypeId is an array, we match if the array contains any of the requested types
    // However, for consistency, if a section with the same sectionId exists, we update it.
    let section = await Section.findOne({
      where: { sectionId: finalSectionId }
    });

    if (section) {
      await section.update({
        businessTypeId: businessTypeArray,
        label,
        type: type || 'section',
        order: order || 0,
        allowedRoles: allowedRoles || section.allowedRoles
      });
    } else {
      section = await Section.create({
        businessTypeId: businessTypeArray,
        sectionId: finalSectionId,
        label,
        type: type || 'section',
        order: order || 0,
        allowedRoles: allowedRoles || []
      });
    }

    return sendResponse(res, {
      statusCode: section ? STATUS_CODES.OK : STATUS_CODES.CREATED,
      message: section ? 'Section updated successfully' : 'Section created successfully',
      data: section
    });
  } catch (error) {
    console.error('Error creating/updating section:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.CREATE_ERROR
    });
  }
};

const getSectionsByBusinessType = async (req, res) => {
  try {
    const { businessType } = req.params;

    const sections = await Section.findAll({
      where: {
        businessTypeId: { [Op.contains]: [businessType] },
        isActive: true
      },
      order: [['order', 'ASC']]
    });

    return sendResponse(res, {
      message: 'Sections fetched successfully',
      data: sections
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR
    });
  }
};

const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findByPk(id);

    if (!section) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: 'Section not found'
      });
    }

    return sendResponse(res, {
      message: 'Section fetched successfully',
      data: section
    });
  } catch (error) {
    console.error('Error fetching section:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR
    });
  }
};

const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const [updatedRowsCount] = await Section.update(updateData, {
      where: { id }
    });

    if (updatedRowsCount === 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: 'Section not found'
      });
    }

    const section = await Section.findByPk(id);

    return sendResponse(res, {
      message: 'Section updated successfully',
      data: section
    });
  } catch (error) {
    console.error('Error updating section:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.UPDATE_ERROR
    });
  }
};

const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if section has menu items
    const menuItems = await MenuItem.findAll({ where: { sectionId: id } });
    if (menuItems.length > 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: 'Cannot delete section with menu items. Delete menu items first.'
      });
    }

    const deletedRowsCount = await Section.destroy({ where: { id } });

    if (deletedRowsCount === 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: 'Section not found'
      });
    }

    return sendResponse(res, {
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DELETE_ERROR
    });
  }
};

// ============================================
// MENU ITEM MANAGEMENT
// ============================================

const createMenuItem = async (req, res) => {
  try {
    const {
      sectionRef,
      title,
      icon,
      path,
      parentId,
      order,
      allowedRoles
    } = req.body;

    // Validate section exists
    const section = await Section.findByPk(sectionRef);
    if (!section) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: 'Section not found'
      });
    }

    // Validate parent exists if parentId provided
    if (parentId) {
      const parent = await MenuItem.findByPk(parentId);
      if (!parent) {
        return sendResponse(res, {
          statusCode: STATUS_CODES.BAD_REQUEST,
          success: false,
          message: 'Parent menu item not found'
        });
      }

      // Parent must be in same section
      if (parent.sectionId !== parseInt(sectionRef)) {
        return sendResponse(res, {
          statusCode: STATUS_CODES.BAD_REQUEST,
          success: false,
          message: 'Parent must be in same section'
        });
      }
    }

    // Upsert logic: check if an item with same path/title exists in this section/parent
    let menuItem = await MenuItem.findOne({
      where: {
        sectionId: sectionRef,
        parentId: parentId || null,
        path: path || null,
        title: title
      }
    });

    if (menuItem) {
      await menuItem.update({
        icon,
        order: order || 0,
        allowedRoles: allowedRoles || menuItem.allowedRoles,
        level: parentId ? 1 : 0
      });
    } else {
      menuItem = await MenuItem.create({
        sectionId: sectionRef,
        title,
        icon,
        path,
        parentId: parentId || null,
        order: order || 0,
        allowedRoles: allowedRoles || [],
        level: parentId ? 1 : 0
      });
    }

    return sendResponse(res, {
      statusCode: STATUS_CODES.CREATED,
      message: menuItem ? 'Menu item updated successfully' : 'Menu item created successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Error creating/updating menu item:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.CREATE_ERROR
    });
  }
};

const getMenuItemsBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const menuItems = await MenuItem.findAll({
      where: {
        sectionId: sectionId,
        isActive: true
      },
      include: [
        { model: Section, attributes: ['businessTypeId', 'sectionId', 'label'] }
      ],
      order: [['order', 'ASC']]
    });

    return sendResponse(res, {
      message: 'Menu items fetched successfully',
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR
    });
  }
};

const getMenuForSidebar = async (req, res) => {
  try {
    let { userRole = null } = req.query;
    const tenant = req.tenant;
    const businessTypeId = tenant.businessTypeId;
    // let allowedMenuItemIds = null;
    // logDebug('businessTypeId', businessTypeId);
    // logDebug('req.store', req.store);
    // // logDebug('req.store.permissions', req.store.permissions);
    // logDebug('tenant', tenant);
    // if (req.store) {
    //   allowedMenuItemIds = req.store.permissions || [];
    // }

    const businessTypeDoc = await BusinessType.findByPk(businessTypeId);
    if (!businessTypeDoc) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: 'Business type not found'
      });
    }

    userRole = userRole || businessTypeDoc.name;

    // 1. Fetch data in batch queries to avoid N+1 problem
    const [baseRouteDoc, sections] = await Promise.all([
      BaseRoute.findOne({ where: { businessTypeId, isActive: true } }),
      Section.findAll({
        where: {
          businessTypeId: { [Op.contains]: [businessTypeId] },
          isActive: true
        },
        order: [['order', 'ASC']]
      })
    ]);

    if (sections.length === 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: 'No sections found for this business type'
      });
    }

    const sectionIds = sections.map(s => s.id);

    // 2. Fetch ALL menu items for these sections in ONE query
    // 2. Fetch ALL menu items for these sections in ONE query
    const whereItems = {
      sectionId: { [Op.in]: sectionIds },
      isActive: true
    };

    // Store Permission Filter (ID based)


    const allMenuItems = await MenuItem.findAll({
      where: whereItems,
      order: [['order', 'ASC']]
    });

    // TenantUser Permission Filter (Key/JSON based)
    let finalMenuItems = allMenuItems;
    let finalSections = sections;

    // --- MANUALLY INJECT TIME SLOT IF CLINIC ---
    // if (businessTypeDoc.name.toLowerCase() === 'clinic') {
    //   const clinicSection = finalSections.find(s => s.sectionId === 'section-clinic');
    //   if (clinicSection) {
    //     const hasTimeSlots = finalMenuItems.some(item => item.path === '/clinic/slots');
    //     if (!hasTimeSlots) {
    //       // Determine order - put it after 'Appointments' if possible, or just append
    //       const timeSlotItem = {
    //         id: 'temp-time-slots', // Temporary ID
    //         sectionId: clinicSection.id,
    //         title: 'Time Slots',
    //         icon: 'ti ti-clock',
    //         path: '/clinic/slots',
    //         parentId: null,
    //         order: 99, // Put it at the end
    //         allowedRoles: [],
    //         level: 0,
    //         isActive: true
    //       };
    //       finalMenuItems.push(timeSlotItem);
    //     }
    //   }
    // }
    // -------------------------------------------

    // --- MANUALLY INJECT SERVICES IF PHARMACY ---
    // if (businessTypeDoc.name.toLowerCase() === 'pharmacy' || businessTypeDoc.name.toLowerCase() === 'medical-store') {
    //   const pharmacySection = finalSections.find(s => s.sectionId === 'section-pharmacy');

    //   if (pharmacySection) {
    //     const hasServices = finalMenuItems.some(item => item.path === '/pharmacy/services');
    //     if (!hasServices) {

    //       // Determine order - put it after 'Sales Returns'
    //       const returnsItem = finalMenuItems.find(item => item.path === '/pharmacy/sales/returns');
    //       const order = returnsItem ? returnsItem.order + 1 : 20;

    //       const servicesItem = {
    //         id: 'temp-services', // Temporary ID
    //         sectionId: pharmacySection.id,
    //         title: 'Services',
    //         icon: 'ti ti-stethoscope', // Or suitable icon
    //         path: '/pharmacy/services',
    //         parentId: null,
    //         order: order,
    //         allowedRoles: [],
    //         level: 0,
    //         isActive: true
    //       };
    //       finalMenuItems.push(servicesItem);
    //       // Re-sort items by order since we pushed a new one
    //       finalMenuItems.sort((a, b) => a.order - b.order);
    //     }
    //   }
    // }

    // --- MANUALLY INJECT SERVICES IF INVENTORY ---
    // (Removed as moved to Pharmacy)
    // -------------------------------------------

    // Unified Permission Filter
    let permissions = null;
    let isAdmin = false;

    if (req.user) {
      if (req.user.role === 'admin') {
        isAdmin = true;
      } else {
        permissions = req.user.permissions;
      }
    } else if (req.store) {
      permissions = req.store.permissions;
    }

    if (isAdmin) {
      // Admin gets everything (Business Owner)
      finalMenuItems = allMenuItems;
      finalSections = sections;
    } else if (permissions && permissions.length > 0) {
      // 1. Filter Sections
      finalSections = sections.filter(section => {
        const perm = permissions.find(p => p.key === section.sectionId);
        return perm && perm.access;
      });

      const allowedSectionIds = finalSections.map(s => s.id);

      // 2. Filter Menu Items (Tabs)
      finalMenuItems = allMenuItems.filter(item => {
        // Must belong to an allowed section
        if (!allowedSectionIds.includes(item.sectionId)) return false;

        // Find section permission
        const section = finalSections.find(s => s.id === item.sectionId);
        const sectionPerm = permissions.find(p => p.key === section.sectionId);

        if (!sectionPerm) return false;

        // If no tabs defined, assume access if section is allowed
        if (!sectionPerm.tabs || sectionPerm.tabs.length === 0) return true;

        // Match Item Title to Tab Key (Fuzzy Match for cases like 'products' vs 'productsservices')
        const itemKey = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const tabPerm = sectionPerm.tabs.find(t => {
          const tabKey = t.key.toLowerCase().replace(/[^a-z0-9]+/g, '');
          // Check for containment in either direction
          return itemKey.includes(tabKey) || tabKey.includes(itemKey);
        });

        return tabPerm && tabPerm.access;
      });
    } else {
       // If not admin and no permissions, possibly empty?
       // For now, if no permissions match above, it falls through with initialized finalMenuItems = allMenuItems
       // BUT we should restrict it if they are supposed to have permissions but array is empty.
       // However, to correspond to original logic:
       // Original logic: "else if (req.store) { // Filter (already done via SQL ID check) }"
       // But SQL check was commented out/removed.
       // If 'permissions' is undefined (e.g. no req.user or req.store), we might default to empty or all?
       // The original code initialized `finalMenuItems = allMenuItems` at line 441.
       // If `isAdmin` is false and `permissions` is empty/null, it keeps `allMenuItems`.
       // This seems risky if unauthorized.
       // But assuming `authenticateUser` middleware is used, one of `req.user`, `req.store`, or `req.admin` (not handled here?) exists.
       // The strict logic should probably default to empty if not admin and not permitted.
       
       if (!isAdmin && (req.user || req.store)) {
           finalMenuItems = [];
           finalSections = [];
       }


    }

    // 3. Organise items into a hierarchy in-memory (Use filtered lists)
    const itemsBySection = {};
    const itemsByParent = {};

    finalMenuItems.forEach(item => {
      // Role filtering
      if (userRole && item.allowedRoles && item.allowedRoles.length > 0) {
        if (!item.allowedRoles.includes(userRole)) {
          return;
        }
      }

      // --- RENAME LOGIC ---
      let itemTitle = item.title;
      if (itemTitle === 'Appointment' || itemTitle === 'Appointments') {
        itemTitle = 'Appointments';
      }
      // --------------------

      const itemData = {
        id: item.id.toString(),
        icon: item.icon,
        label: itemTitle,
        originalTitle: item.title, // Pass original title for permission checks
        path: item.path
      };

      if (!item.parentId) {
        if (!itemsBySection[item.sectionId]) itemsBySection[item.sectionId] = [];
        itemsBySection[item.sectionId].push(itemData);
      } else {
        if (!itemsByParent[item.parentId]) itemsByParent[item.parentId] = [];
        itemsByParent[item.parentId].push(itemData);
      }
    });

    // 4. Recursive builder function (now working with in-memory data)
    const buildTree = (items) => {
      return items.map(item => {
        const children = itemsByParent[item.id];
        if (children && children.length > 0) {
          return { ...item, children: buildTree(children) };
        }
        return item;
      });
    };

    // 5. Build final sections map
    const sectionsMap = {};
    finalSections.forEach(section => {
      // Role filtering for section
      if (userRole && section.allowedRoles && section.allowedRoles.length > 0) {
        if (!section.allowedRoles.includes(userRole)) {
          return;
        }
      }

      const rootItems = itemsBySection[section.id] || [];
      if (rootItems.length > 0) {
        sectionsMap[section.sectionId] = {
          id: section.sectionId,
          type: section.type,
          label: section.label,
          items: buildTree(rootItems)
        };
      }
    });

    return sendResponse(res, {
      message: 'Menu fetched successfully',
      data: {
        businessType: businessTypeDoc.name,
        baseRoute: baseRouteDoc ? baseRouteDoc.baseRoute : '/dashboard',
        sections: sectionsMap
      }
    });
  } catch (error) {
    console.error('Error fetching menu sidebar:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR
    });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findOne({
      where: { id, isActive: true },
      include: [
        { model: Section, attributes: ['businessTypeId', 'sectionId', 'label'] }
      ]
    });

    if (!menuItem) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: 'Menu item not found'
      });
    }

    return sendResponse(res, {
      message: 'Menu item fetched successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR
    });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const [updatedRowsCount] = await MenuItem.update(updateData, {
      where: { id }
    });

    if (updatedRowsCount === 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: 'Menu item not found'
      });
    }

    const menuItem = await MenuItem.findByPk(id, {
      include: [
        { model: Section, attributes: ['businessTypeId', 'sectionId', 'label'] }
      ]
    });

    return sendResponse(res, {
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.UPDATE_ERROR
    });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if has children
    const children = await MenuItem.findAll({ where: { parentId: id } });
    if (children.length > 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: 'Cannot delete menu item with children'
      });
    }

    const deletedRowsCount = await MenuItem.destroy({ where: { id } });

    if (deletedRowsCount === 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: 'Menu item not found'
      });
    }

    return sendResponse(res, {
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DELETE_ERROR
    });
  }
};

export default {
  // Base routes
  setBaseRoute,
  getAllBaseRoutes,

  // Sections
  createSection,
  getSectionsByBusinessType,
  getSectionById,
  updateSection,
  deleteSection,

  // Menu items
  createMenuItem,
  getMenuItemsBySection,
  getMenuForSidebar,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem
};