import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Section, MenuItem, BaseRoute } from './src/models/menu/menu.model.js';
import { BusinessType } from './src/models/business/business-type.model.js';

dotenv.config();

const verifyMultipleBusinessTypes = async () => {
    try {
        await mongoose.connect(process.env.DB_url);
        console.log('Connected to DB');

        // 1. Create two business types
        const hospital = await BusinessType.create({ name: 'Hospital_' + Date.now(), isActive: true });
        const clinic = await BusinessType.create({ name: 'Clinic_' + Date.now(), isActive: true });

        await BaseRoute.create({ businessType: hospital._id, baseRoute: '/hospital' });
        await BaseRoute.create({ businessType: clinic._id, baseRoute: '/clinic' });

        // 2. Create a SHARED section visible to both business types
        const sharedSection = await Section.create({
            businessType: [hospital._id, clinic._id], // Multiple business types
            label: 'Shared Section',
            allowedRoles: []
        });

        await MenuItem.create({
            sectionRef: sharedSection._id,
            title: 'Shared Item',
            path: '/shared',
            allowedRoles: []
        });

        // 3. Create Hospital-only section
        const hospitalSection = await Section.create({
            businessType: [hospital._id],
            label: 'Hospital Only Section',
            allowedRoles: []
        });

        await MenuItem.create({
            sectionRef: hospitalSection._id,
            title: 'Hospital Item',
            path: '/hospital-only',
            allowedRoles: []
        });

        // 4. Test retrieval

        console.log('\n--- Testing Hospital Menu ---');
        const hospitalMenu = await MenuItem.getMenuByBusinessType(hospital._id, null);
        const hospitalSections = Object.keys(hospitalMenu.sections);
        console.log('Hospital sees sections:', hospitalSections);

        if (hospitalSections.includes('shared-section') && hospitalSections.includes('hospital-only-section')) {
            console.log('PASS: Hospital sees both Shared and Hospital-only sections');
        } else {
            console.log('FAIL: Hospital missing sections');
        }

        console.log('\n--- Testing Clinic Menu ---');
        const clinicMenu = await MenuItem.getMenuByBusinessType(clinic._id, null);
        const clinicSections = Object.keys(clinicMenu.sections);
        console.log('Clinic sees sections:', clinicSections);

        if (clinicSections.includes('shared-section') && !clinicSections.includes('hospital-only-section')) {
            console.log('PASS: Clinic sees Shared section but NOT Hospital-only section');
        } else {
            console.log('FAIL: Clinic visibility incorrect');
        }

        // Cleanup
        await MenuItem.deleteMany({ sectionRef: { $in: [sharedSection._id, hospitalSection._id] } });
        await Section.deleteMany({ _id: { $in: [sharedSection._id, hospitalSection._id] } });
        await BaseRoute.deleteMany({ businessType: { $in: [hospital._id, clinic._id] } });
        await BusinessType.deleteMany({ _id: { $in: [hospital._id, clinic._id] } });
        console.log('\nCleanup done');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyMultipleBusinessTypes();
