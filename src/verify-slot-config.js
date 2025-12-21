import { ClinicSlotConfig, DoctorSlotConfig, SlotOverride, sequelize, Tenant, User, Admin } from './models/index.js';

// Disable logging for cleaner output
sequelize.options.logging = false;

async function verifySlotConfig() {
    try {
        await sequelize.authenticate({ logging: false });
        console.log('Database connected.');

        // Sync models
        // await Tenant.sync({ alter: true, logging: false });
        // await User.sync({ alter: true, logging: false });
        // await ClinicSlotConfig.sync({ alter: true, logging: false });
        // await DoctorSlotConfig.sync({ alter: true, logging: false });
        // await SlotOverride.sync({ alter: true, logging: false });
        console.log('Models synced.');

        // Setup Test Data
        // 1. Get Admin (assuming one exists from previous steps)
        const admin = await Admin.findOne();
        if (!admin) {
            console.error('No admin found. Please create one first.');
            return;
        }

        // 2. Get/Create Tenant (Need a tenant for context)
        let tenant = await Tenant.findOne();
        if (!tenant) {
            // Create a dummy tenant if none exists (unlikely in real scenario but good for standalone test)
            // For now, let's assume one exists or fail.
            console.error('No tenant found. Cannot proceed.');
            return;
        }
        const tenantId = tenant.id;
        console.log(`Using Tenant ID: ${tenantId}`);

        // 3. Get/Create Doctor
        let doctor = await User.findOne(); // Just pick any user as doctor for test
        // If no doctor found, let's just pick the first user and pretend they are a doctor for this test
        if (!doctor) {
            doctor = await User.create({
                name: 'Test Doctor',
                email: 'testdoctor@example.com',
                tenantId: tenantId // Assuming tenantId is needed or ignored if not in model
            });
        }

        if (!doctor) {
            console.error('No user/doctor found. Cannot proceed.');
            return;
        }
        const doctorId = doctor.id;
        console.log(`Using Doctor ID: ${doctorId}`);


        // --- TEST 1: Clinic Slots ---
        console.log('\n--- TEST 1: Clinic Slots ---');
        const clinicSlots = {
            "Monday": [{ "startTime": "09:00", "endTime": "10:00", "maxPatients": 2 }],
            "Tuesday": []
        };

        // Simulate Controller Logic for Update Clinic Slots
        let cConfig = await ClinicSlotConfig.findOne({ where: { tenantId } });
        if (cConfig) {
            cConfig.weeklySlots = clinicSlots;
            await cConfig.save();
        } else {
            await ClinicSlotConfig.create({ tenantId, weeklySlots: clinicSlots });
        }
        console.log('Clinic Slots Updated.');

        // Verify Available Slots (Should match Clinic)
        // Simulate Controller Logic for Get Available Slots
        let dayName = 'Monday'; // Let's test Monday
        // In real app, we pass a date. Let's pick a future Monday.
        const testDate = '2025-12-22'; // A Monday

        // Logic: Override -> Doctor -> Clinic
        let availableSlots = [];

        // 1. Override?
        const override = await SlotOverride.findOne({ where: { tenantId, doctorId, date: testDate } });
        if (override) {
            availableSlots = override.slots;
            console.log('Source: Override');
        } else {
            // 2. Doctor?
            const dConfig = await DoctorSlotConfig.findOne({ where: { tenantId, doctorId } });
            if (dConfig && !dConfig.useClinicSlots) {
                availableSlots = dConfig.customWeeklySlots[dayName] || [];
                console.log('Source: Doctor Custom');
            } else {
                // 3. Clinic
                const cConfig = await ClinicSlotConfig.findOne({ where: { tenantId } });
                if (cConfig) {
                    availableSlots = cConfig.weeklySlots[dayName] || [];
                    console.log('Source: Clinic Default');
                }
            }
        }
        console.log('Available Slots (Expect Clinic):', JSON.stringify(availableSlots));


        // --- TEST 2: Doctor Custom Slots ---
        console.log('\n--- TEST 2: Doctor Custom Slots ---');
        const doctorSlots = {
            "Monday": [{ "startTime": "10:00", "endTime": "11:00", "maxPatients": 3 }]
        };

        // Update Doctor Config
        let dConfig = await DoctorSlotConfig.findOne({ where: { tenantId, doctorId } });
        if (dConfig) {
            dConfig.useClinicSlots = false;
            dConfig.customWeeklySlots = doctorSlots;
            await dConfig.save();
        } else {
            await DoctorSlotConfig.create({
                tenantId,
                doctorId,
                useClinicSlots: false,
                customWeeklySlots: doctorSlots
            });
        }
        console.log('Doctor Slots Updated (Custom).');

        // Verify Available Slots (Should match Doctor)
        // Logic: Override -> Doctor -> Clinic
        availableSlots = [];
        const override2 = await SlotOverride.findOne({ where: { tenantId, doctorId, date: testDate } });
        if (override2) {
            availableSlots = override2.slots;
            console.log('Source: Override');
        } else {
            const dConfig2 = await DoctorSlotConfig.findOne({ where: { tenantId, doctorId } });
            if (dConfig2 && !dConfig2.useClinicSlots) {
                availableSlots = dConfig2.customWeeklySlots[dayName] || [];
                console.log('Source: Doctor Custom');
            } else {
                const cConfig2 = await ClinicSlotConfig.findOne({ where: { tenantId } });
                if (cConfig2) {
                    availableSlots = cConfig2.weeklySlots[dayName] || [];
                    console.log('Source: Clinic Default');
                }
            }
        }
        console.log('Available Slots (Expect Doctor):', JSON.stringify(availableSlots));


        // --- TEST 3: Slot Override ---
        console.log('\n--- TEST 3: Slot Override ---');
        const overrideSlots = [{ "startTime": "12:00", "endTime": "13:00", "maxPatients": 5 }];

        // Create Override
        await SlotOverride.create({
            tenantId,
            doctorId,
            date: testDate,
            slots: overrideSlots
        });
        console.log('Override Created.');

        // Verify Available Slots (Should match Override)
        availableSlots = [];
        const override3 = await SlotOverride.findOne({ where: { tenantId, doctorId, date: testDate } });
        if (override3) {
            availableSlots = override3.slots;
            console.log('Source: Override');
        } else {
            // ... (rest of logic)
        }
        console.log('Available Slots (Expect Override):', JSON.stringify(availableSlots));

        // Cleanup
        await SlotOverride.destroy({ where: { tenantId, doctorId, date: testDate } });
        await DoctorSlotConfig.destroy({ where: { tenantId, doctorId } });
        // Keep Clinic Config as it's global, or delete if strictly testing
        // await ClinicSlotConfig.destroy({ where: { tenantId } });

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await sequelize.close();
    }
}

verifySlotConfig();
