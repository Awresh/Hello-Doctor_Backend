import { ClinicSlotConfig, DoctorSlotConfig, SlotOverride } from "../models/index.js";

export class SlotRepository {
    async findOverride(tenantId, doctorId, date, transaction) {
        return await SlotOverride.findOne({
            where: { tenantId, doctorId, date },
            transaction
        });
    }

    async findDoctorConfig(tenantId, doctorId, transaction) {
        return await DoctorSlotConfig.findOne({
            where: { tenantId, doctorId },
            transaction
        });
    }

    async findClinicConfig(tenantId, transaction) {
        return await ClinicSlotConfig.findOne({
            where: { tenantId },
            transaction
        });
    }
}
