const MenuConfig = require('../models/menu/menu.model');

/**
 * Sample menu data matching your frontend sidebarService structure
 */
const menuData = [
  {
    businessType: 'pharmacy',
    baseRoute: '/pharmacy/dashboard',
    sections: {
      analytics: {
        id: 'analytics',
        type: 'section',
        label: 'Analytics',
        items: [
          {
            id: 'main-dashboard',
            icon: 'home',
            label: 'Main Dashboard',
            path: '/dashboard/main'
          },
          {
            id: 'analytics',
            icon: 'chart-line',
            label: 'Analytics',
            path: '/dashboard/analytics'
          }
        ]
      },
      pharmacy: {
        id: 'pharmacy',
        type: 'section',
        label: 'Pharmacy',
        items: [
          {
            id: 'pharmacy-dashboard',
            icon: 'dashboard',
            label: 'Pharmacy Dashboard',
            path: '/pharmacy/dashboard'
          },
          {
            id: 'sales-management',
            icon: 'cash',
            label: 'Sales Management',
            path: '/pharmacy/sales',
            children: [
              {
                id: 'pos-sales',
                icon: 'device-pos',
                label: 'POS Sales',
                path: '/pharmacy/billing'
              },
              {
                id: 'sales-history',
                icon: 'history',
                label: 'Sales History',
                path: '/pharmacy/sales-history'
              }
            ]
          },
          {
            id: 'inventory-management',
            icon: 'package',
            label: 'Inventory Management',
            path: '/pharmacy/inventory',
            children: [
              {
                id: 'medicine-stock',
                icon: 'pill',
                label: 'Medicine Stock',
                path: '/pharmacy/inventory/medicine'
              },
              {
                id: 'stock-adjustment',
                icon: 'adjustments',
                label: 'Stock Adjustment',
                path: '/pharmacy/inventory/adjustment'
              }
            ]
          }
        ]
      },
      inventory: {
        id: 'inventory',
        type: 'section',
        label: 'Inventory',
        items: [
          {
            id: 'inventory-dashboard',
            icon: 'dashboard',
            label: 'Inventory Dashboard',
            path: '/inventory/dashboard'
          },
          {
            id: 'products-services',
            icon: 'package',
            label: 'Products & Services',
            path: '/inventory/products'
          },
          {
            id: 'purchases',
            icon: 'shopping-cart',
            label: 'Purchases',
            path: '/inventory/purchases'
          },
          {
            id: 'stock-adjustment',
            icon: 'adjustments',
            label: 'Stock Adjustment',
            path: '/inventory/stock-adjustment'
          }
        ]
      }
    },
    allowedRoles: ['admin', 'manager', 'staff'],
    isActive: true
  },
  {
    businessType: 'clinic',
    baseRoute: '/clinic/info',
    sections: {
      analytics: {
        id: 'analytics',
        type: 'section',
        label: 'Analytics',
        items: [
          {
            id: 'main-dashboard',
            icon: 'home',
            label: 'Main Dashboard',
            path: '/dashboard/main'
          }
        ]
      },
      clinic: {
        id: 'clinic',
        type: 'section',
        label: 'Clinic',
        items: [
          {
            id: 'clinic-info',
            icon: 'info-circle',
            label: 'Clinic Information',
            path: '/clinic/info'
          },
          {
            id: 'departments',
            icon: 'building',
            label: 'Departments',
            path: '/clinic/departments'
          }
        ]
      },
      medical: {
        id: 'medical',
        type: 'section',
        label: 'Medical Staff',
        items: [
          {
            id: 'doctor-list',
            icon: 'users',
            label: 'Doctor List',
            path: '/doctors/list'
          },
          {
            id: 'doctor-schedule',
            icon: 'calendar',
            label: 'Schedules',
            path: '/doctors/schedule'
          }
        ]
      },
      patients: {
        id: 'patients',
        type: 'section',
        label: 'Patient Care',
        items: [
          {
            id: 'patient-list',
            icon: 'list',
            label: 'Patient List',
            path: '/patients/list'
          },
          {
            id: 'appointments',
            icon: 'calendar-event',
            label: 'Appointments',
            path: '/patients/appointments'
          }
        ]
      }
    },
    allowedRoles: ['admin', 'doctor', 'staff'],
    isActive: true
  },
  {
    businessType: 'inventory',
    baseRoute: '/inventory/dashboard',
    sections: {
      inventory: {
        id: 'inventory',
        type: 'section',
        label: 'Inventory',
        items: [
          {
            id: 'inventory-dashboard',
            icon: 'dashboard',
            label: 'Inventory Dashboard',
            path: '/inventory/dashboard'
          },
          {
            id: 'products-services',
            icon: 'package',
            label: 'Products & Services',
            path: '/inventory/products'
          },
          {
            id: 'purchases',
            icon: 'shopping-cart',
            label: 'Purchases',
            path: '/inventory/purchases'
          },
          {
            id: 'stock-adjustment',
            icon: 'adjustments',
            label: 'Stock Adjustment',
            path: '/inventory/stock-adjustment'
          }
        ]
      }
    },
    allowedRoles: ['admin', 'manager', 'staff'],
    isActive: true
  }
];

/**
 * Seed menu configurations into database
 */
const seedMenuData = async () => {
  try {
    console.log('Starting menu data seeding...');

    // Clear existing data
    await MenuConfig.deleteMany({});
    console.log('Cleared existing menu configurations');

    // Insert new data
    const result = await MenuConfig.insertMany(menuData);
    console.log(`Successfully seeded ${result.length} menu configurations`);
    
    result.forEach(config => {
      console.log(`  - ${config.businessType}: ${Object.keys(config.sections).length} sections`);
    });

    return result;
  } catch (error) {
    console.error('Error seeding menu data:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  const mongoose = require('mongoose');
  
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    return seedMenuData();
  })
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedMenuData, menuData };
