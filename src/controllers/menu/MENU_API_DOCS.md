# Menu API - Complete Documentation with Section Schema

## Overview
This API has **3 main entities**:
1. **BaseRoute** - Base route for each business type
2. **Section** - Sections within each business type (Analytics, Pharmacy, etc.)
3. **MenuItem** - Individual menu items within sections (with multi-level support)

---

## Step 1: Set Base Route

**Endpoint:** `POST /api/menu/base-route`

**Pharmacy:**
```json
{
  "businessType": "65abc123...", // BusinessType ID
  "baseRoute": "/pharmacy/dashboard"
}
```

**Clinic:**
```json
{
  "businessType": "65abc123...",
  "baseRoute": "/clinic/info"
}
```

---

## Step 2: Create Sections

**Endpoint:** `POST /api/menu/section`

### Example 1: Analytics Section for Pharmacy
```json
{
  "businessType": "65abc123...", // BusinessType ID
  "label": "Analytics"
  // sectionId auto-generated: "analytics"
  // order auto-generated: 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc111...",
    "businessType": "65abc123...",
    "sectionId": "analytics",
    "label": "Analytics",
    "order": 1
  }
}
```

### Example 2: Pharmacy Section
```json
{
  "businessType": "65abc123...",
  "label": "Pharmacy"
  // sectionId: "pharmacy", order: 2
}
```

### Example 3: Inventory Section
```json
{
  "businessType": "65abc123...",
  "label": "Inventory"
  // sectionId: "inventory", order: 3
}
```

---

## Step 3: Create Menu Items

**Endpoint:** `POST /api/menu/item`

Now use the **Section ID** from Step 2 as `sectionRef`.

### Example 1: Main Dashboard (in Analytics Section)
```json
{
  "sectionRef": "65abc111...",
  "title": "Main Dashboard",
  "icon": "home",
  "path": "/dashboard/main",
  "parentId": null,
  "allowedRoles": ["admin", "doctor", "staff"]
  // order auto-generated: 1
}
```

### Example 2: Analytics (in Analytics Section)
```json
{
  "sectionRef": "65abc111...",
  "title": "Analytics",
  "icon": "chart-line",
  "path": "/dashboard/analytics",
  "parentId": null,
  "allowedRoles": ["admin", "doctor"]
  // order auto-generated: 2
}
```

### Example 3: Parent Menu (Sales Management)
```json
{
  "sectionRef": "65abc222...",
  "title": "Sales Management",
  "icon": "cash",
  "path": "/pharmacy/sales",
  "parentId": null,
  "allowedRoles": ["admin", "staff"]
  // order auto-generated: 1
}
```

**Response gives you the parent ID:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc333...",
    "title": "Sales Management"
  }
}
```

### Example 4: Child Menu (POS Sales)
```json
{
  "sectionRef": "65abc222...",
  "title": "POS Sales",
  "icon": "device-pos",
  "path": "/pharmacy/billing",
  "parentId": "65abc333...",
  "allowedRoles": ["admin", "staff"]
  // order auto-generated: 1 (within parent)
}
```

### Example 5: Another Child (Sales History)
```json
{
  "sectionRef": "65abc222...",
  "title": "Sales History",
  "icon": "history",
  "path": "/pharmacy/sales-history",
  "parentId": "65abc333...",
  "allowedRoles": ["admin"]
  // order auto-generated: 2 (within parent)
}
```

---

## Step 4: Get Menu for Frontend

**Endpoint:** `GET /api/menu/sidebar/:businessType?userRole=doctor`

### Example Request:
```
GET /api/menu/sidebar/pharmacy?userRole=admin
```

### Example Response (SidebarService Format):
```json
{
  "success": true,
  "data": {
    "businessType": "pharmacy",
    "baseRoute": "/pharmacy/dashboard",
    "sections": {
      "analytics": {
        "id": "analytics",
        "type": "section",
        "label": "Analytics",
        "items": [
          {
            "id": "65abc001",
            "icon": "home",
            "label": "Main Dashboard",
            "path": "/dashboard/main"
          },
          {
            "id": "65abc002",
            "icon": "chart-line",
            "label": "Analytics",
            "path": "/dashboard/analytics"
          }
        ]
      },
      "pharmacy": {
        "id": "pharmacy",
        "type": "section",
        "label": "Pharmacy",
        "items": [
          {
            "id": "65abc003",
            "icon": "cash",
            "label": "Sales Management",
            "path": "/pharmacy/sales",
            "children": [
              {
                "id": "65abc004",
                "icon": "device-pos",
                "label": "POS Sales",
                "path": "/pharmacy/billing"
              },
              {
                "id": "65abc005",
                "icon": "history",
                "label": "Sales History",
                "path": "/pharmacy/sales-history"
              }
            ]
          }
        ]
      }
    }
  }
}
```

---

## Complete Workflow Example

### 1. Setup Base Route
```bash
POST /api/menu/base-route
{
  "businessType": "pharmacy",
  "baseRoute": "/pharmacy/dashboard"
}
```

### 2. Create Sections
```bash
# Analytics Section
POST /api/menu/section
{
  "businessType": "pharmacy",
  "sectionId": "analytics",
  "label": "Analytics",
  "order": 1
}
# Response: { "_id": "SECTION_1_ID" }

# Pharmacy Section
POST /api/menu/section
{
  "businessType": "pharmacy",
  "sectionId": "pharmacy",
  "label": "Pharmacy",
  "order": 2
}
# Response: { "_id": "SECTION_2_ID" }
```

### 3. Create Menu Items
```bash
# Item in Analytics Section
POST /api/menu/item
{
  "sectionRef": "SECTION_1_ID",
  "title": "Main Dashboard",
  "icon": "home",
  "path": "/dashboard/main",
  "order": 1
}

# Parent item in Pharmacy Section
POST /api/menu/item
{
  "sectionRef": "SECTION_2_ID",
  "title": "Sales Management",
  "icon": "cash",
  "path": "/pharmacy/sales",
  "order": 1
}
# Response: { "_id": "PARENT_ID" }

# Child item
POST /api/menu/item
{
  "sectionRef": "SECTION_2_ID",
  "title": "POS Sales",
  "icon": "device-pos",
  "path": "/pharmacy/billing",
  "parentId": "PARENT_ID",
  "order": 1
}
```

### 4. Get Menu
```bash
GET /api/menu/sidebar/pharmacy?userRole=admin
```

---

## All Endpoints

### Base Routes
```
POST   /api/menu/base-route          - Create/update base route
GET    /api/menu/base-routes         - Get all base routes
```

### Sections
```
POST   /api/menu/section             - Create section
GET    /api/menu/sections/:businessType - Get sections for business type
GET    /api/menu/section/:id         - Get section by ID
PUT    /api/menu/section/:id         - Update section
DELETE /api/menu/section/:id         - Delete section
```

### Menu Items
```
POST   /api/menu/item                - Create menu item
GET    /api/menu/items/section/:sectionId - Get items for section
GET    /api/menu/item/:id            - Get single item
PUT    /api/menu/item/:id            - Update item
DELETE /api/menu/item/:id            - Delete item
```

### Sidebar Format
```
GET    /api/menu/sidebar/:businessType?userRole=xxx - Get menu in sidebar format
```

---

## Schema Reference

### BaseRoute
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| businessType | String | ✅ | pharmacy, clinic, inventory, hospital, diagnostic |
| baseRoute | String | ✅ | Default route path |

### Section
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| businessType | ObjectId | ✅ | Reference to BusinessType ID |
| label | String | ✅ | Display name |
| sectionId | String | No | Auto-generated from label if missing |
| type | String | No | Default: "section" |
| order | Number | No | Auto-generated (increments) |

### MenuItem
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sectionRef | ObjectId | ✅ | Reference to Section |
| title | String | ✅ | Menu display name |
| icon | String | No | Icon identifier |
| path | String | No | Route path |
| parentId | ObjectId | No | Parent menu item (null = root) |
| order | Number | No | Auto-generated (increments) |
| allowedRoles | Array | No | Roles: admin, manager, user, doctor, patient, staff, guest |
| level | Number | Auto | Hierarchy level (0 = root, 1 = child) |

---

## Quick Copy-Paste Examples

### Create Complete Pharmacy Menu

```bash
# 1. Base Route
curl -X POST http://localhost:3000/api/menu/base-route \
-H "Content-Type: application/json" \
-d '{"businessType":"pharmacy","baseRoute":"/pharmacy/dashboard"}'

# 2. Create Section
curl -X POST http://localhost:3000/api/menu/section \
-H "Content-Type: application/json" \
-d '{"businessType":"pharmacy","sectionId":"analytics","label":"Analytics","order":1}'

# Save the section _id from response, then:

# 3. Create Menu Item
curl -X POST http://localhost:3000/api/menu/item \
-H "Content-Type: application/json" \
-d '{"sectionRef":"SECTION_ID_HERE","title":"Dashboard","icon":"home","path":"/dashboard","order":1}'

# 4. Get Menu
curl http://localhost:3000/api/menu/sidebar/pharmacy?userRole=admin
```

---

## Data Flow Summary

```
1. Create BaseRoute (pharmacy → /pharmacy/dashboard)
2. Create Section (pharmacy → analytics)
3. Create MenuItem (sectionRef → analytics, title → Dashboard)
4. Get Sidebar (pharmacy) → Returns organized menu with sections & items
```

---

## Frontend Integration

Replace `sidebarService.js`:

```javascript
export const fetchSidebarData = async (vendorType) => {
  const actualVendorType = vendorType || getUserVendorType();
  const userRole = getUserRole();
  
  const response = await fetch(
    `/api/menu/sidebar/${actualVendorType}?userRole=${userRole}`
  );
  
  const result = await response.json();
  return result.data; // { businessType, baseRoute, sections }
};
```
