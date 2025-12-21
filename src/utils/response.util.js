export const createResponse = ({
  statusCode = 200,
  success = true,
  message = 'Success',
  data = null
} = {}) => ({
  statusCode,
  success,
  message,
  data
})

export const sendResponse = (res, {
  statusCode = 200,
  success = true,
  message = 'Success',
  data = null
} = {}) => {
  const response = createResponse({ statusCode, success, message, data })
  return res.status(statusCode).json(response)
}