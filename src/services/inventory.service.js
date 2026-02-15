import { CrudRepository } from "../repositories/crud.repository.js";
import { CrudService } from "./crud.service.js";
import { Brand, Category, Unit, Supplier, Store, Customer } from "../models/index.js";

export class BrandService extends CrudService {
    constructor() {
        super(new CrudRepository(Brand));
    }
}

export class CategoryService extends CrudService {
    constructor() {
        super(new CrudRepository(Category));
    }
}

export class UnitService extends CrudService {
    constructor() {
        super(new CrudRepository(Unit));
    }
}

export class SupplierService extends CrudService {
    constructor() {
        super(new CrudRepository(Supplier));
    }
}

export class StoreService extends CrudService {
    constructor() {
        super(new CrudRepository(Store));
    }
}

export class CustomerService extends CrudService {
    constructor() {
        super(new CrudRepository(Customer));
    }
}
