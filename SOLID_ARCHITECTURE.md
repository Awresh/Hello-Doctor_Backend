# SOLID Architecture Documentation

## Overview
This codebase follows SOLID principles with a clean layered architecture pattern.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│          Controllers (HTTP Layer)        │  ← Thin, handles requests/responses
├─────────────────────────────────────────┤
│          Validators (Input Layer)        │  ← Validates input data
├─────────────────────────────────────────┤
│         Services (Business Logic)        │  ← Core business logic
├─────────────────────────────────────────┤
│       Repositories (Data Access)         │  ← Database operations
├─────────────────────────────────────────┤
│            Models (Data Layer)           │  ← Database schemas
└─────────────────────────────────────────┘
```

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP) ✓
Each class has ONE reason to change:
- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic only
- **Repositories**: Handle database operations only
- **Validators**: Validate input data only

**Example:**
```javascript
// Before (Violates SRP)
export const createAppointment = async (req, res) => {
    // Validation
    if (!doctorId) return error;
    // Database query
    const user = await User.findOne(...);
    // Business logic
    const slotMatch = availableSlots.find(...);
    // More database queries
    await Appointment.create(...);
    // Socket emission
    getIO().emit(...);
}

// After (Follows SRP)
export const createAppointment = async (req, res) => {
    appointmentValidator.validateCreateAppointment(req.body);
    const appointment = await appointmentService.createAppointment(req.body);
    socketService.emitAppointmentUpdate('create', appointment);
    return sendResponse(res, { data: appointment });
}
```

### 2. Open/Closed Principle (OCP) ✓
Classes are open for extension but closed for modification.

**Example: Authentication Strategy Pattern**
```javascript
// Before (Violates OCP - must modify for new auth types)
if (decoded.storeId) { /* handle store */ }
else if (decoded.userId) { /* handle user */ }
else if (decoded.adminId) { /* handle admin */ }
// Adding new type requires modifying this code

// After (Follows OCP - extend without modifying)
export class AuthStrategyFactory {
    static getStrategy(decoded) {
        if (decoded.storeId) return new StoreAuthStrategy();
        if (decoded.userId) return new UserAuthStrategy();
        if (decoded.adminId) return new AdminAuthStrategy();
        // Add new strategy without modifying existing ones
    }
}
```

### 3. Liskov Substitution Principle (LSP) ✓
Derived classes can substitute base classes.

**Example:**
```javascript
export class BaseRepository {
    async findById(id) { return await this.model.findByPk(id); }
}

export class AdminRepository extends BaseRepository {
    // Can be used anywhere BaseRepository is expected
}
```

### 4. Interface Segregation Principle (ISP) ✓
Clients shouldn't depend on interfaces they don't use.

**Example:**
```javascript
// Separate focused services instead of one large service
class UserService { /* user operations */ }
class SlotService { /* slot operations */ }
class NotificationService { /* notification operations */ }
```

### 5. Dependency Inversion Principle (DIP) ✓
Depend on abstractions, not concretions.

**Example:**
```javascript
// Before (Depends on concrete Model)
import { Admin } from "../../models/index.js";
const admin = await Admin.findOne({ where: { email } });

// After (Depends on abstraction - Repository)
class AdminService {
    constructor() {
        this.adminRepository = new AdminRepository(); // Abstraction
    }
}
```

## Directory Structure

```
src/
├── controllers/           # HTTP request handlers (thin)
│   ├── admin/
│   │   └── auth.controller.js
│   ├── clinic/
│   │   └── appointment.controller.js
│   └── tenant/
│       └── tenant.controller.js
│
├── services/             # Business logic layer
│   ├── admin.service.js
│   ├── appointment.service.js
│   ├── auth.service.js
│   ├── auth-strategy.service.js
│   ├── jwt.service.js
│   ├── notification.service.js
│   ├── slot.service.js
│   ├── socket.service.js
│   ├── tenant.service.js
│   └── user.service.js
│
├── repositories/         # Data access layer
│   ├── base.repository.js
│   ├── admin.repository.js
│   ├── appointment.repository.js
│   ├── slot.repository.js
│   ├── tenant.repository.js
│   └── user.repository.js
│
├── validators/           # Input validation layer
│   ├── admin.validator.js
│   ├── appointment.validator.js
│   └── auth.validator.js
│
├── models/              # Database models (unchanged)
├── middleware/          # Express middleware
└── utils/              # Utility functions
```

## Usage Examples

### Creating a New Feature

1. **Create Repository** (Data Access)
```javascript
// repositories/product.repository.js
export class ProductRepository {
    async findAll(where) {
        return await Product.findAll({ where });
    }
}
```

2. **Create Service** (Business Logic)
```javascript
// services/product.service.js
export class ProductService {
    constructor() {
        this.productRepository = new ProductRepository();
    }
    
    async getProducts(filters) {
        return await this.productRepository.findAll(filters);
    }
}
```

3. **Create Validator** (Input Validation)
```javascript
// validators/product.validator.js
export class ProductValidator {
    validateCreate(data) {
        if (!data.name) throw { statusCode: 400, message: 'Name required' };
    }
}
```

4. **Create Controller** (HTTP Handler)
```javascript
// controllers/product.controller.js
const productService = new ProductService();
const productValidator = new ProductValidator();

export const getProducts = async (req, res) => {
    try {
        const products = await productService.getProducts(req.query);
        return sendResponse(res, { data: products });
    } catch (error) {
        return sendResponse(res, { 
            statusCode: error.statusCode || 500, 
            message: error.message 
        });
    }
}
```

## Benefits

1. **Testability**: Each layer can be tested independently
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Easy to add new features
4. **Reusability**: Services and repositories can be reused
5. **Flexibility**: Easy to swap implementations

## Migration Status

### ✅ Completed
- Admin Authentication (login, register)
- Appointment Management (CRUD, slots, queue)
- Tenant Management (profile, license)
- Auth Middleware (strategy pattern)
- User Management

### 🔄 To Be Migrated
- Inventory controllers
- Payment controllers
- Notification controllers
- Menu controllers
- Other domain controllers

## Best Practices

1. **Keep controllers thin** - Only handle HTTP concerns
2. **Services contain business logic** - No HTTP or database code
3. **Repositories handle data** - No business logic
4. **Validators validate** - No business logic
5. **Use dependency injection** - Pass dependencies via constructor
6. **Error handling** - Throw errors with statusCode and message
7. **Consistent patterns** - Follow established patterns

## Error Handling Pattern

```javascript
// In Service
throw { statusCode: 400, message: 'Invalid data' };

// In Controller
try {
    const result = await service.method();
    return sendResponse(res, { data: result });
} catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Operation failed';
    return sendResponse(res, { statusCode, success: false, message });
}
```

## Testing

Each layer can be tested independently:

```javascript
// Test Service (mock repository)
const mockRepo = { findById: jest.fn() };
const service = new Service();
service.repository = mockRepo;

// Test Controller (mock service)
const mockService = { getAll: jest.fn() };
const controller = createController(mockService);
```
