import { Tenant, BusinessType } from "../../models/index.js"
import { MESSAGES } from "../../config/serverConfig.js"
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import jwt from "jsonwebtoken"

// Login tenant
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    
    const tenant = await Tenant.scope('withPassword').findOne({ 
      where: { email },
      include: [{ model: BusinessType, attributes: ['name'] }]
    })
    
    if (!tenant) {
      return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Invalid credentials' })
    }
    
    const isPasswordValid = await tenant.comparePassword(password)
    if (!isPasswordValid) {
      return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Invalid credentials' })
    }
    
    const token = jwt.sign({ tenantId: tenant.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' })
    
    // Remove password from response
    const tenantResponse = { ...tenant.toJSON() }
    delete tenantResponse.password
    
    return sendResponse(res, { message: 'Login successful', data: { tenant: tenantResponse, token } })
  } catch (error) {
    console.log('check Error', error)
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Login failed' })
  }
}

// Register tenant
export const register = async (req, res) => {
  try {
    const { name, email, businessName, businessType, password } = req.body
    
    if (!businessType) {
      return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Business type is required' })
    }
    
    const existingTenant = await Tenant.findOne({ where: { email } })
    if (existingTenant) {
      return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant already exists' })
    }
    
    const tenant = await Tenant.create({ 
      name, 
      email, 
      businessName, 
      businessTypeId: businessType, 
      password 
    })
    
    const populatedTenant = await Tenant.findByPk(tenant.id, {
      include: [{ model: BusinessType, attributes: ['name'] }]
    })
    
    const token = jwt.sign({ tenantId: tenant.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' })
    
    return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: 'Registration successful', data: { tenant: populatedTenant, token } })
  } catch (error) {
    console.error('Registration Error:', error)
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Registration failed' })
  }
}

export default {
  login,
  register
}