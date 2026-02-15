import { CrudRepository } from "../repositories/crud.repository.js";
import { CrudService } from "./crud.service.js";
import { TimeSettings, SpecialHoliday, Role, TenantUser, PaymentMode, Plan } from "../models/index.js";

export class TimeSettingsService extends CrudService {
    constructor() {
        super(new CrudRepository(TimeSettings));
    }
}

export class SpecialHolidayService extends CrudService {
    constructor() {
        super(new CrudRepository(SpecialHoliday));
    }
}

export class RoleService extends CrudService {
    constructor() {
        super(new CrudRepository(Role));
    }
}

export class TenantUserService extends CrudService {
    constructor() {
        super(new CrudRepository(TenantUser));
    }
}

export class PaymentModeService extends CrudService {
    constructor() {
        super(new CrudRepository(PaymentMode));
    }
}

export class PlanService extends CrudService {
    constructor() {
        super(new CrudRepository(Plan));
    }
}
