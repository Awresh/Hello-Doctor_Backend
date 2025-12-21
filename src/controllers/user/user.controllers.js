import { Users, BusinessType } from "../../models/index.js"
import { MESSAGES } from "../../config/serverConfig.js"
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      include: [{ model: BusinessType, attributes: ['name'] }]
    })
    return sendResponse(res, { message: 'Users fetched successfully', data: users })
  } catch (error) {
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: MESSAGES.FETCH_ERROR })
  }
}

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await Users.findByPk(id, {
      include: [{ model: BusinessType, attributes: ['name'] }]
    })
    
    if (!user) {
      return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: 'User not found' })
    }
    
    return sendResponse(res, { message: 'User fetched successfully', data: user })
  } catch (error) {
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: MESSAGES.FETCH_ERROR })
  }
}

// Create new user
export const createUser = async (req, res) => {
  try {
    const { userName, email, businessName, businessType, password } = req.body
    
    const existingUser = await Users.findOne({ where: { email } })
    if (existingUser) {
      return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'User already exists' })
    }
    
    const user = await Users.create({ userName, email, businessName, businessTypeId: businessType, password })
    
    return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: 'User created successfully', data: user })
  } catch (error) {
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: MESSAGES.CREATE_ERROR })
  }
}

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { userName, email, businessName, businessType } = req.body
    
    const [updatedRowsCount] = await Users.update(
      { userName, email, businessName, businessTypeId: businessType },
      { where: { id } }
    )
    
    if (updatedRowsCount === 0) {
      return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: 'User not found' })
    }
    
    const user = await Users.findByPk(id, {
      include: [{ model: BusinessType, attributes: ['name'] }]
    })
    
    return sendResponse(res, { message: 'User updated successfully', data: user })
  } catch (error) {
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: MESSAGES.UPDATE_ERROR })
  }
}

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    
    const deletedRowsCount = await Users.destroy({ where: { id } })
    
    if (deletedRowsCount === 0) {
      return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: 'User not found' })
    }
    
    return sendResponse(res, { message: 'User deleted successfully' })
  } catch (error) {
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: MESSAGES.DELETE_ERROR })
  }
}

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}