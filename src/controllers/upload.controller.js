import { sendResponse } from "../utils/response.util.js";
import { STATUS_CODES } from "../config/statusCodes.js";

export const uploadFile = (req, res) => {
    try {
        if (!req.file) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "No file uploaded"
            });
        }

        // Construct URL (assuming static file serving is set up)
        const fileUrl = `/uploads/${req.file.filename}`;

        return sendResponse(res, {
            statusCode: STATUS_CODES.OK,
            message: "File uploaded successfully",
            data: {
                url: fileUrl,
                filename: req.file.filename
            }
        });
    } catch (error) {
        console.error("Upload error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "File upload failed"
        });
    }
};
