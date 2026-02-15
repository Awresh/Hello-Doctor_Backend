
import { PaymentMode } from '../../models/index.js';
import sequelize from 'sequelize';
import { MESSAGES } from '../../config/serverConfig.js';

export const getPaymentModes = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const paymentModes = await PaymentMode.findAll({
            where: { tenantId },
            order: [['createdAt', 'ASC']]
        });
        res.status(200).json({ success: true, data: paymentModes });
    } catch (error) {
        next(error);
    }
};

export const createPaymentMode = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { name, isEnabled, taxPercentage } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Payment mode name is required' });
        }

        const existingMode = await PaymentMode.findOne({
            where: {
                tenantId,
                name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), name.toLowerCase())
            }
        });

        if (existingMode) {
            return res.status(400).json({ success: false, message: 'Payment mode with this name already exists' });
        }

        const newPaymentMode = await PaymentMode.create({
            tenantId,
            name,
            taxPercentage: taxPercentage || 0,
            isEnabled: isEnabled !== undefined ? isEnabled : true,
            isDefault: false // First one isn't auto-default unless specified, but logic below handles it better if we want to allow passing isDefault
        });

        // If this is the FIRST payment mode, make it default automatically
        const count = await PaymentMode.count({ where: { tenantId } });
        if (count === 1) {
            newPaymentMode.isDefault = true;
            await newPaymentMode.save();
        }

        res.status(201).json({ success: true, message: 'Payment mode created successfully', data: newPaymentMode });
    } catch (error) {
        next(error);
    }
};

export const updatePaymentMode = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const { name, isEnabled, isDefault, taxPercentage } = req.body;

        const paymentMode = await PaymentMode.findOne({ where: { id, tenantId } });

        if (!paymentMode) {
            return res.status(404).json({ success: false, message: 'Payment mode not found' });
        }

        if (name !== undefined) {
             const existingMode = await PaymentMode.findOne({
                where: {
                    tenantId,
                    name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), name.toLowerCase())
                }
            });

            if (existingMode && existingMode.id !== parseInt(id)) {
                return res.status(400).json({ success: false, message: 'Payment mode with this name already exists' });
            }
            paymentMode.name = name;
        }
        if (isEnabled !== undefined) paymentMode.isEnabled = isEnabled;
        if (taxPercentage !== undefined) paymentMode.taxPercentage = taxPercentage;

        if (isDefault === true) {
            // Unset other defaults
            await PaymentMode.update({ isDefault: false }, { where: { tenantId } });
            paymentMode.isDefault = true;
        }

        await paymentMode.save();

        res.status(200).json({ success: true, message: 'Payment mode updated successfully', data: paymentMode });
    } catch (error) {
        next(error);
    }
};

export const deletePaymentMode = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        const deleted = await PaymentMode.destroy({ where: { id, tenantId } });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Payment mode not found' });
        }

        res.status(200).json({ success: true, message: 'Payment mode deleted successfully' });
    } catch (error) {
        next(error);
    }
};
