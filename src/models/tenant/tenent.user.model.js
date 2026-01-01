import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../config/db.config.js';

export const TenantUser = sequelize.define('TenantUser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Role of the user e.g. doctor, receptionist'
    },
    about: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    experience: {
        type: DataTypes.STRING,
        allowNull: true
    },
    speciality: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    //[{menuId:2, permissions:['read','write'],tab:[]}]  For No Tab Modules
    //[{moduleId:1, permissions:[], subModules:[{id:1, permissions:['read']}]}]  For Modules with SubModules
    permissions: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: true,
        defaultValue: [],
        comment: `
            JSON structure for permissions:
            [
                {
                    "key": "inventory",       // Sidebar Module Identifier
                    "name": "Inventory",
                    "access": true,           // Sidebar Level Access
                    "tabs": [
                        {
                            "key": "products",    // Tab Identifier
                            "name": "Products",
                            "access": true,       // Tab Level Access
                            "actions": {          // Granular Action Permissions
                                "create": true,
                                "read": true,
                                "update": false,
                                "delete": false,
                                "export": true
                            }
                        }
                    ]
                }
            ]
        `
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true, // Optional for now to avoid breaking existing users immediately, but should be required for new users
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true // Optional for now
    },
    isDoctor: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Can be null if we want clinic-wide overrides later, but primarily for doctors
        field: 'doctor_id',
        references: {
            model: 'tenant_users',
            key: 'id'
        }
    }
}, {
    tableName: 'tenant_users',
    timestamps: true,
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password') && user.password) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        }
    },
    defaultScope: {
        attributes: { exclude: ['password'] }
    },
    scopes: {
        withPassword: {
            attributes: {}
        }
    }
});

/**
 * Check if the user has permission for a specific module, tab, and action.
 * Hierarchy: Sidebar -> Tab -> Action
 * 
 * @param {string} sidebarKey - Key of the sidebar module (e.g., 'inventory')
 * @param {string} tabKey - (Optional) Key of the tab (e.g., 'products')
 * @param {string} actionKey - (Optional) Key of the action (e.g., 'create')
 * @returns {boolean} - True if permitted, False otherwise
 */
TenantUser.prototype.hasPermission = function (sidebarKey, tabKey = null, actionKey = null) {
    if (!this.permissions || !Array.isArray(this.permissions)) {
        return false;
    }

    // 1. Check Sidebar Level
    const sidebarModule = this.permissions.find(p => p.key === sidebarKey);
    if (!sidebarModule || !sidebarModule.access) {
        return false;
    }

    // If only sidebar verification is needed
    if (!tabKey) {
        return true;
    }

    // 2. Check Tab Level
    if (!sidebarModule.tabs || !Array.isArray(sidebarModule.tabs)) {
        return false;
    }

    const tabModule = sidebarModule.tabs.find(t => t.key === tabKey);
    if (!tabModule || !tabModule.access) {
        return false;
    }

    // If only tab verification is needed
    if (!actionKey) {
        return true;
    }

    // 3. Check Action Level
    if (!tabModule.actions) {
        return false;
    }

    return !!tabModule.actions[actionKey];
};

/**
 * Compare password for login
 * @param {string} candidatePassword 
 * @returns {Promise<boolean>}
 */
TenantUser.prototype.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};
