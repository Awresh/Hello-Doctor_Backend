import { sequelize, Tenant, TenantUser, BusinessType, DoctorSlotConfig, SlotOverride } from './src/models/index.js';

async function verifyTenantUser() {
    try {
        // Sync database
        await sequelize.sync({ alter: true });
        console.log('Database synced');

        // Create a dummy business type
        let businessType = await BusinessType.findOne();
        if (!businessType) {
            businessType = await BusinessType.create({ name: 'Clinic', description: 'Medical Clinic' });
        }

        // Create a dummy Tenant
        const tenant = await Tenant.create({
            name: 'Test Tenant',
            email: `test${Date.now()}@example.com`,
            businessName: 'Test Clinic',
            businessTypeId: businessType.id,
            password: 'password123'
        });
        console.log('Tenant created:', tenant.id);

        // Create a TenantUser (Doctor)
        const doctor = await TenantUser.create({
            name: 'Dr. John Doe',
            role: 'doctor',
            about: 'Experienced cardiologist',
            description: 'Specializes in heart health',
            experience: '10 years',
            speciality: 'Cardiology',
            tenantId: tenant.id
        });
        console.log('Doctor (TenantUser) created:', doctor.id);

        // Create a TenantUser (Staff) linked to Doctor
        const staff = await TenantUser.create({
            name: 'Nurse Jane',
            role: 'nurse',
            tenantId: tenant.id,
            doctorId: doctor.id
        });
        console.log('Staff (TenantUser) created:', staff.id);

        // Verify Staff -> Doctor association
        const fetchedStaff = await TenantUser.findByPk(staff.id, {
            include: [{ model: TenantUser, as: 'doctor' }]
        });

        if (fetchedStaff.doctor && fetchedStaff.doctor.id === doctor.id) {
            console.log('Association verified: Staff linked to Doctor');
        } else {
            console.error('Association verification failed: Staff not linked to Doctor');
        }

        // Create DoctorSlotConfig
        const slotConfig = await DoctorSlotConfig.create({
            tenantId: tenant.id,
            doctorId: doctor.id,
            useClinicSlots: true
        });
        console.log('DoctorSlotConfig created:', slotConfig.id);

        // Verify DoctorSlotConfig -> Doctor association
        const fetchedConfig = await DoctorSlotConfig.findByPk(slotConfig.id, {
            include: [{ model: TenantUser, as: 'doctor' }]
        });

        if (fetchedConfig.doctor && fetchedConfig.doctor.id === doctor.id) {
            console.log('Association verified: DoctorSlotConfig linked to Doctor');
        } else {
            console.error('Association verification failed: DoctorSlotConfig not linked to Doctor');
        }

        // Create SlotOverride
        const override = await SlotOverride.create({
            tenantId: tenant.id,
            doctorId: doctor.id,
            date: new Date(),
            slots: []
        });
        console.log('SlotOverride created:', override.id);

        // Verify SlotOverride -> Doctor association
        const fetchedOverride = await SlotOverride.findByPk(override.id, {
            include: [{ model: TenantUser, as: 'doctor' }]
        });

        if (fetchedOverride.doctor && fetchedOverride.doctor.id === doctor.id) {
            console.log('Association verified: SlotOverride linked to Doctor');
        } else {
            console.error('Association verification failed: SlotOverride not linked to Doctor');
        }

        // Clean up
        await override.destroy();
        await slotConfig.destroy();
        await staff.destroy();
        await doctor.destroy();
        await tenant.destroy();
        console.log('Cleanup complete');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await sequelize.close();
    }
}

verifyTenantUser();
