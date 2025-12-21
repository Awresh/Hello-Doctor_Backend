// =================================Logging System Start================================

// Environment-based logging configuration
const LOG_CONFIG = {
    // Check if we're in production mode
    IS_PRODUCTION: (typeof import.meta !== 'undefined' && import.meta.env?.PROD) || false,

    // Enable/disable specific log levels via environment variables
    ENABLE_DEBUG: (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_ENABLE_DEBUG === 'true') || true,
    ENABLE_INFO: (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_ENABLE_INFO === 'true') || true,
    ENABLE_WARN: (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_ENABLE_WARN === 'true') || true,
    ENABLE_ERROR: (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_ENABLE_ERROR === 'true') || true,
    ENABLE_TRACE: (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_ENABLE_TRACE === 'true') || false,

    // Global logging toggle
    ENABLE_ALL_LOGS: (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_ENABLE_ALL_LOGS === 'true') || true
}

// Log levels
const LOG_LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    TRACE: 'TRACE'
}

/**
 * Core logging function that handles all log types
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, TRACE)
 * @param {string} tag - Tag/category for the log
 * @param {...any} args - Arguments to log
 */
function coreLog(level, tag, ...args) {
    // Skip all logs in production unless specifically enabled
    if (LOG_CONFIG.IS_PRODUCTION && !LOG_CONFIG.ENABLE_ALL_LOGS) {
        return
    }

    // Check if specific log level is enabled
    const levelEnabled = {
        [LOG_LEVELS.DEBUG]: LOG_CONFIG.ENABLE_DEBUG,
        [LOG_LEVELS.INFO]: LOG_CONFIG.ENABLE_INFO,
        [LOG_LEVELS.WARN]: LOG_CONFIG.ENABLE_WARN,
        [LOG_LEVELS.ERROR]: LOG_CONFIG.ENABLE_ERROR,
        [LOG_LEVELS.TRACE]: LOG_CONFIG.ENABLE_TRACE
    }

    if (!levelEnabled[level] && !LOG_CONFIG.ENABLE_ALL_LOGS) {
        return
    }

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}] [${tag}]`

    switch (level) {
        case LOG_LEVELS.DEBUG:
            console.debug(prefix, ...args)
            break
        case LOG_LEVELS.INFO:
            console.info(prefix, ...args)
            break
        case LOG_LEVELS.WARN:
            console.warn(prefix, ...args)
            break
        case LOG_LEVELS.ERROR:
            console.error(prefix, ...args)
            break
        case LOG_LEVELS.TRACE:
            console.trace(prefix, ...args)
            break
        default:
            console.log(prefix, ...args)
    }
}

/**
 * Debug logging - for detailed debugging information
 * @param {string} tag - Tag/category for the log
 * @param {...any} args - Arguments to log
 */
export function logDebug(tag, ...args) {
    coreLog(LOG_LEVELS.DEBUG, tag, ...args)
}

/**
 * Info logging - for general information
 * @param {string} tag - Tag/category for the log
 * @param {...any} args - Arguments to log
 */
export function logInfo(tag, ...args) {
    coreLog(LOG_LEVELS.INFO, tag, ...args)
}

/**
 * Warning logging - for warnings
 * @param {string} tag - Tag/category for the log
 * @param {...any} args - Arguments to log
 */
export function logWarn(tag, ...args) {
    coreLog(LOG_LEVELS.WARN, tag, ...args)
}

/**
 * Error logging - for errors
 * @param {string} tag - Tag/category for the log
 * @param {...any} args - Arguments to log
 */
export function logErr(tag, ...args) {
    coreLog(LOG_LEVELS.ERROR, tag, ...args)
}

/**
 * Trace logging - for stack traces
 * @param {string} tag - Tag/category for the log
 * @param {...any} args - Arguments to log
 */
export function logTrace(tag, ...args) {
    coreLog(LOG_LEVELS.TRACE, tag, ...args)
}

/**
 * General logging function (defaults to INFO level)
 * @param {string} tag - Tag/category for the log
 * @param {...any} args - Arguments to log
 */
export function log(tag, ...args) {
    coreLog(LOG_LEVELS.INFO, tag, ...args)
}

/**
 * API logging - specifically for API calls
 * @param {string} method - HTTP method
 * @param {string} url - API endpoint
 * @param {any} data - Request/response data
 * @param {string} status - Status (REQUEST/RESPONSE/ERROR)
 */
export function logApi(method, url, data, status = 'INFO') {
    const tag = `API_${method.toUpperCase()}`
    logInfo(tag, `${status}: ${url}`, data)
}

/**
 * Component logging - for React component lifecycle
 * @param {string} componentName - Name of the component
 * @param {string} action - Action being performed
 * @param {...any} args - Additional arguments
 */
export function logComponent(componentName, action, ...args) {
    const tag = `COMPONENT_${componentName.toUpperCase()}`
    logDebug(tag, action, ...args)
}

/**
 * Performance logging - for performance measurements
 * @param {string} operation - Operation being measured
 * @param {number} duration - Duration in milliseconds
 * @param {...any} args - Additional arguments
 */
export function logPerf(operation, duration, ...args) {
    const tag = 'PERFORMANCE'
    logInfo(tag, `${operation} took ${duration}ms`, ...args)
}

// =================================Logging System End================================

// =================================String Utilities Start================================

/**
 * Convert string to uppercase
 * @param {string} str - String to convert
 * @returns {string} - Uppercase string
 */
export function toUpperCase(str) {
    return String(str || '').toUpperCase()
}

/**
 * Convert string to lowercase
 * @param {string} str - String to convert
 * @returns {string} - Lowercase string
 */
export function toLowerCase(str) {
    return String(str || '').toLowerCase()
}

/**
 * Convert string to title case (first letter of each word capitalized)
 * @param {string} str - String to convert
 * @returns {string} - Title case string
 */
export function toTitleCase(str) {
    return String(str || '')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

/**
 * Convert string to sentence case (first letter capitalized)
 * @param {string} str - String to convert
 * @returns {string} - Sentence case string
 */
export function toSentenceCase(str) {
    const s = String(str || '').toLowerCase()
    return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Convert string to camelCase
 * @param {string} str - String to convert
 * @returns {string} - camelCase string
 */
export function toCamelCase(str) {
    return String(str || '')
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
}

/**
 * Convert string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} - kebab-case string
 */
export function toKebabCase(str) {
    return String(str || '')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
}

/**
 * Convert string to snake_case
 * @param {string} str - String to convert
 * @returns {string} - snake_case string
 */
export function toSnakeCase(str) {
    return String(str || '')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase()
}

// =================================String Utilities End================================

// =================================Common functions start================================

/**
 * Adjusts the opacity of a hex color code and returns it in rgba format or hex with alpha.
 *
 * @param {string} colorCode - The hex color code, either 6 or 7 characters long (with or without `#`).
 *                            If longer, it will be trimmed to the correct length.
 *                            Must follow hex format, e.g., "#000000" or "000000".
 *                            Throws an error if not in the correct format after trimming.
 * @param {number} [alpha=.3] - A number between 0 and 1 representing the desired opacity.
 *                         Throws an error if outside the range.
 * @param {boolean} [toRgba=false] - If true, returns the color in rgba format, otherwise in hex with alpha appended.
 * @returns {string} - The modified color code. If `toRgba` is true, it returns in `rgba` format.
 *                     If `toRgba` is false, it returns in hex format with alpha appended.
 * @throws {Error} - Throws errors for invalid color format or invalid alpha.
 *
 * @example 1: Standard use case with a color code in hex, 50% opacity, returning rgba format
 * colorAlpha("#ff5733", 0.5, true); // Output: "rgba(255, 87, 51, 0.5)"
 *
 * @example 2: No `#` provided, returns hex format with alpha appended
 * colorAlpha("ff5733extra", 1, false); // Output: "#ff5733ff"
 *
 * @example 3: Alpha at 0.25 (25% opacity), returning in hex with alpha
 * colorAlpha("#ff57330000", '0.25', false); // Output: "#ff57333f"
 */
export function colorAlpha(colorCode, alpha = .3, toRgba = false) {
    const fun = "colorAlpha";
    if (!checkNullStr(colorCode)) return colorCode;

    let cCode = String(colorCode);

    // Trim colorCode to valid lengths (6 or 7 characters)
    if (cCode.length > 7) {
        cCode = cCode[0] === "#" ? cCode.slice(0, 7) : cCode.slice(0, 6);
        // logErr(fun, `Trimming colorCode '${String(colorCode)}' to '${cCode}' for processing.`);
    }

    // Validate color code length
    if (cCode.length !== 6 && cCode.length !== 7) {
        const msg = `Invalid color code length after trimming. Must be 6 or 7 characters (e.g., "#ff5733" or "ff5733"). Found '${cCode}'.`;
        console.log(fun, msg);
        // throw new Error(msg);
    }

    // Ensure color code starts with "#" if not already
    if (cCode[0] !== "#") {
        cCode = `#${cCode}`;
    }

    // Validate hex format using a regular expression
    if (!/^#[0-9A-Fa-f]{6}$/.test(cCode)) {
        const msg = `Invalid color format. Must be a 6-digit hex code. Found '${cCode}'.`;
        console.log(fun, msg);
        // throw new Error(msg);
    }

    // Validate alpha range
    if (!checkIsNumber(alpha) || toNumber(alpha) < 0 || toNumber(alpha) > 1) {
        const msg = `Invalid alpha value. Must be a number between 0 and 1. Found '${alpha}'.`;
        console.log(fun, msg);
        // throw new Error(msg);
    }

    // Convert hex to RGB
    const hex = cCode.slice(1); // remove "#"
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Convert alpha to hex format for hex output
    const alphaHex = Math.round(toNumber(alpha) * 255).toString(16).padStart(2, '0');

    // Return in requested format
    return isBoolTrue(toRgba) ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `${cCode}${alphaHex}`;
}

/**
 * Checks if any of the provided strings/values is non-empty.
 *
 * @param {...(string|null|any)} values - The values to check.
 * @returns {boolean} - Returns `true` if any value is a non-empty string, otherwise `false`.
 *
 * @example 1: Checking a single empty string
 * checkNullStr(""); // Output: false
 *
 * @example 2: Checking a single non-empty string
 * checkNullStr("Hello"); // Output: true
 *
 * @example 3: Checking a null value
 * checkNullStr(null); // Output: false
 *
 * @example 4: Checking with trimming enabled
 * checkNullStr("   "); // Output: false
 *
 * @example 5: Checking multiple values, one is non-empty
 * checkNullStr("", null, "World"); // Output: true
 *
 * @example 6: Checking multiple empty values
 * checkNullStr("", "   ", null); // Output: false
 */
export function checkNullStr(...values) {
    return values.some(value => {
        const item = String(value).trim();
        return checkNull(item, '') && item.length > 0;
    });
}

/**
 * Returns true if the object is not null and not undefined.
 */
export function checkNull(obj, checkExtra = null) {
    return obj !== undefined && obj + "" !== 'undefined' && obj !== null && obj + "" !== 'null' && (obj + "").toLowerCase() !== 'nan' && obj !== checkExtra
}

/**
 * function support various number formats like integers, floats, and scientific notation.
 *
 * - ^-?: Allows an optional negative sign at the beginning of the number.
 * - \d+: Matches one or more digits (required for integers and the integer part of floats).
 * - (\.\d+)?: Allows an optional decimal part for floats.
 * - ([eE][-+]?\d+)?: Supports scientific notation with an optional exponent, e or E, followed by an optional + or - sign and digits.
 *
 * @param {any} value - Value to check if it's a Number or not.
 * @return {boolean} Returns true/false based on whether values is Number or not.
 *
 * @example
 * log("-10", checkIsNumber(-10));       // true (integer)
 * log("10.5", checkIsNumber(10.5));       // true (integer)
 * log("123", checkIsNumber("123"));       // true (integer)
 * log("-123.45", checkIsNumber("-123.45"));   // true (float)
 * log("1.23e+4", checkIsNumber("1.23e+4"));   // true (scientific notation)
 * log("0.123", checkIsNumber("0.123"));     // true (decimal)
 * log("123e-5", checkIsNumber("123e-5"));    // true (scientific notation with negative exponent)
 * log("abc", checkIsNumber("abc"));       // false (not a number)
 * log("12.34.56", checkIsNumber("12.34.56"));  // false (invalid number)
 */
export function checkIsNumber(value) {
    // return /^\d+$/.test(value);
    return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(value);
}

/**
 * Converts any number or string to a number.
 * Handles edge cases like ".5", "0", or invalid inputs.
 *
 * @param {string|number} input - The input to convert.
 * @param {number} [defaultValue=0] - The default value to return if conversion fails.
 * @returns {number} - The converted number.
 * @throws {TypeError} - Throws if the input is invalid and no default value is provided.
 *
 * @example
 * log(toNumber("0"));           // 0
 * log(toNumber(".5"));          // 0.5
 * log(toNumber(1));             // 1
 * log(toNumber("123.45"));      // 123.45
 * log(toNumber("   .25   "));   // 0.25
 * log(toNumber("invalid", 0));  // 0
 * log(toNumber("invalid"));     // Throws TypeError
 * log(toNumber(null, 5));       // 5
 * log(toNumber(undefined, 10)); // 10
 */
export function toNumber(input, defaultValue = 0) {
    if (typeof input === "number" && !isNaN(input)) {
        return input; // Return the number if it's already valid
    }

    if (typeof input === "string") {
        const trimmedInput = input.trim();

        // Special case for ".5", which is valid
        // if (/^\.\d+$/.test(trimmedInput)) {
        if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmedInput)) {
            return parseFloat(trimmedInput);
        }

        // Attempt to parse as a number
        const parsed = parseFloat(trimmedInput);
        if (!isNaN(parsed)) {
            return parsed;
        }
    }

    // If invalid and defaultValue is provided, return it
    if (typeof defaultValue === "number" && !isNaN(defaultValue)) {
        return defaultValue;
    }

    throw new TypeError("Invalid input; cannot convert to a number");
}

/**
 * Returns true if value is getTrue or "true" or 1 (if checkYN=checkBinary) or "yes"/"YES"/"Yes" (if checkYN=true),
 * otehrwise false.
 *
 * @param {any} boolValue  - value to check.
 * @param {boolean} checkBinary  - Whether to check if value is binary(0 or 1).
 * @param {boolean} checkYN  - Whether to check if value is yes/no ("yes"/"YES"/"Yes" or "no"/"NO"/"No").
 * @return {boolean} - Returns true/false depending on the specified value.
 */
export function isBoolTrue(boolValue, checkBinary = false, checkYN = false) {
    let value = boolValue === true || boolValue === 'true';
    if (!value && checkBinary) {
        value = isBinaryTrue(boolValue);
    }
    if (!value && checkYN) {
        const boolStr = (boolValue + "").toLowerCase().trim();
        value = boolStr === 'y' || boolStr === 'yes';
    }
    return value;
}

export function isBinaryTrue(value) {
    return value === 1 || value === '1';
}

/**
 * Retrieves the value of a nested key from a JSON object using either an array of keys or a dot-separated string path.
 * Handles invalid inputs and missing values gracefully. Supports fallback default values and optional empty-value filtering.
 *
 * @param {Object} obj - The JSON object to retrieve the value from.
 * @param {string | string[]} keys - Dot-separated key path (e.g. "user.details.age") or an array of keys (e.g. ["user", "details", "age"]).
 * @param {*} defValue - The default value to return if the object, keys, or nested path is invalid. Defaults to an empty object.
 * @param {boolean} [dropEmpty=false] - Whether to treat empty values (`null`, `undefined`, '', etc.) as invalid and fallback to `defValue`.
 * @returns {*} - The value at the nested key path, or the `defValue` if the path is invalid or not found.
 *
 * @example Accessing a nested value using key array
 * const obj = { user: { name: "Alice", details: { age: 25 } } };
 * const result = getJsonValueFromNestedKeys(obj, ["user", "details", "age"], "Unknown");
 * log(result); // Output: 25
 *
 * @example Accessing a nested value using dot string
 * const obj = { user: { name: "Alice", details: { age: 25 } } };
 * const result = getJsonValueFromNestedKeys(obj, "user.details.age", "Unknown");
 * log(result); // Output: 25
 *
 * @example Invalid object
 * const obj = null;
 * const result = getJsonValueFromNestedKeys(obj, ["user", "name"], "No data");
 * log(result); // Output: "No data"
 *
 * @example Dropping empty/null values
 * const obj = { user: { name: "Alice", details: { age: null } } };
 * const result = getJsonValueFromNestedKeys(obj, "user.details.age", "Unknown", true);
 * log(result); // Output: "Unknown"
 */
export function getJsonValueFromNestedKeys(obj, keys = [], defValue = {}, dropEmpty = false) {
    try {
        if (!checkNullJson(obj, dropEmpty)) return defValue;

        // Accept dot-string or array
        const keyPath = checkNullArr(keys) ? keys : String(keys).split('.');
        if (!checkNullArr(keyPath)) return defValue;

        let value = obj;
        for (const key of keyPath) {
            try {
                if (checkNullStr(key, true)) {
                    value = value[key];
                } else {
                    return defValue;
                }
            } catch {
                return defValue;
            }
        }

        // return dropEmpty ? getDefStr(value, defValue) : (value ?? defValue);
        return getDefStr(value, defValue);
    } catch {
        return defValue;
    }
}

/**
 * Checks if the given object is a valid, non-null JSON-like object or array.
 * Optionally removes empty/null values when `dropEmpty` is true.
 *
 * @param {Object|Array} obj - The input object or array to validate.
 * @param {boolean} [dropEmpty=false] - Whether to remove empty/null values before validation.
 * @returns {boolean} - Returns `true` if the input is a valid, non-empty JSON object or array, otherwise `false`.
 *
 * @example 1: Filtering an array of mixed types
 * const list = ['hello', { a: 1 }, [], {}, null, { b: '' }, [1, 2], true];
 * const filteredList = list.filter(item => checkNullJson(item));
 * log(filteredList); // Output: [{ a: 1 }, [1, 2], { b: '' }]
 *
 * @example 2: Use with `dropEmpty` parameter
 * const list = [{ x: null, y: 'value' }, { x: '' }, { z: 0 }, { a: undefined }, [1, 2]];
 * const filteredList = list.filter(item => checkNullJson(item, true));
 * log(filteredList); // Output: [{ y: 'value' }, { z: 0 }, [1, 2]]
 *
 * @example 3: Handling edge cases
 * const invalidInputs = [null, undefined, 42, 'string', true, { a: undefined }, { b: null }];
 * const filteredList = invalidInputs.filter(item => checkNullJson(item));
 * log(filteredList); // Output: []
 *
 * @example 4: Nested JSON handling
 * const nestedObjects = [
 *   { a: { b: null }, c: 1 },
 *   { x: { y: undefined } },
 *   {},
 *   { nested: { value: 'data' } }
 * ];
 * const filteredList = nestedObjects.filter(item => checkNullJson(item, true));
 * log(filteredList); // Output: [{ c: 1 }, { nested: { value: 'data' } }]
 *
 * @example 5: Validating individual objects
 * const objects = [{}, { a: 1 }, [], null, 'hello'];
 * objects.forEach(obj => {
 *   const isValid = checkNullJson(obj);
 *   log(`Object: ${JSON.stringify(obj)}, Valid: ${isValid}`);
 * });
 * // Output:
 * // Object: {}, Valid: false
 * // Object: {"a":1}, Valid: true
 * // Object: [], Valid: false
 * // Object: null, Valid: false
 * // Object: "hello", Valid: false
 */
export function checkNullJson(obj, dropEmpty = false) {
    try {
        // if (isBoolTrue(dropEmpty)) {
        //     obj = dropJsonNullValues(obj);
        // }
        // return Object.keys(obj).length > 0;

        // Ensure obj is a JSON-like object (non-null object or array)
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        if (isBoolTrue(dropEmpty)) {
            obj = dropJsonNullValues(obj);
        }

        // Check if the object or array has keys/length
        return Object.keys(obj).length > 0;
    } catch (e) {
        return false;
    }
}

/**
 * Checks if an object is a valid non-empty array. Optionally removes empty elements before validation.
 *
 * @param {Array} obj - The object to check for array validity.
 * @param {boolean} [dropEmpty=false] - Whether to drop empty elements (`null`, `undefined`, empty strings) before validation.
 * @returns {boolean} - Returns `true` if the object is a valid non-empty array (considering the `dropEmpty` flag); otherwise, `false`.
 *
 * @example 1: Valid non-empty array
 * const obj = [1, 2, 3];
 * const result = checkNullArr(obj);
 * log(result); // Output: true
 *
 * @example 2: Empty array
 * const obj = [];
 * const result = checkNullArr(obj);
 * log(result); // Output: false
 *
 * @example 3: Dropping empty elements
 * const obj = [1, "", null, 2];
 * const result = checkNullArr(obj, true);
 * log(result); // Output: true
 *
 * @example 4: Invalid object
 * const obj = "Not an array";
 * const result = checkNullArr(obj);
 * log(result); // Output: false
 *
 * @example 5: Array with all empty elements
 * const obj = ["", null, undefined];
 * const result = checkNullArr(obj, true);
 * log(result); // Output: false
 */
export function checkNullArr(obj = [], dropEmpty = false) {
    if (isBoolTrue(dropEmpty)) {
        return ((checkNull(obj) && isArr(obj)) && obj.length > 0) && dropListEmptyElements(obj).length > 0;
    } else {
        return (checkNull(obj) && isArr(obj)) && obj.length > 0
    }
}

/**
 * Returns the first non-null/non-empty value from the provided arguments.
 *
 * @param {...*} values - A list of values to check for the first valid (non-null, non-empty) value.
 * @returns {*} - The first non-null/non-empty value, or an empty string if none are found.
 *
 * @example
 * getDefStr(null, "", "Value", "Default"); // Output: "Value"
 * getDefStr(undefined, null, ""); // Output: ""
 */
export function getDefStr(...values) {
    // return values.find((value) => checkNullStr(value)) || "";
    const found = values.find((value) => checkNullStr(value));
    return checkNullStr(found) ? found : "";
}

export function dropJsonNullValues(obj) {
    for (let key in obj) {
        if (!checkNullStr(obj[key])) {
            delete obj[key];
        }
    }
    return obj;
}

/**
 * Checks if the given object is an array.
 *
 * @param {*} obj - The object to check.
 * @returns {boolean} - Returns `true` if the object is an array, otherwise `false`.
 *
 * @example 1
 * isArr([1, 2, 3]); // true
 *
 * @example 2
 * isArr("hello"); // false
 */
export function isArr(obj) {
    return Array.isArray(obj);
}

/**
 * Removes empty or unwanted elements from a list based on specified values.
 *
 * @param {Array} list - The array to filter and remove empty or specified values.
 * @param {Array} [valuesToCheckToRemove=[]] - An array of values to remove from the list in addition to empty elements. Defaults to an empty array.
 * @returns {Array} - A new array with the unwanted elements removed.
 *
 * @example 1: Removing empty elements
 * const list = [1, "", null, 2, undefined, 3];
 * const result = dropListEmptyElements(list);
 * log(result); // Output: [1, 2, 3]
 *
 * @example 2: Removing specific values
 * const list = [1, "remove", 2, "delete", 3];
 * const result = dropListEmptyElements(list, ["remove", "delete"]);
 * log(result); // Output: [1, 2, 3]
 *
 * @example 3: Mixed empty and specific values
 * const list = [null, 1, "remove", undefined, 2, "", "delete"];
 * const result = dropListEmptyElements(list, ["remove", "delete"]);
 * log(result); // Output: [1, 2]
 *
 * @example 4: No values to check for removal
 * const list = [1, 2, 3];
 * const result = dropListEmptyElements(list);
 * log(result); // Output: [1, 2, 3]
 *
 * @example 5: Invalid input
 * const list = "Not an array";
 * const result = dropListEmptyElements(list);
 * log(result); // Output: "Not an array"
 */
export function dropListEmptyElements(list = [], valuesToCheckToRemove = []) {
    try {
        return list.filter((item) => {
            if (!checkNullStr(item)) return false;
            return !(checkNullArr(valuesToCheckToRemove) && valuesToCheckToRemove.includes(item));
        });
    } catch (e) {
        logErr(e);
        return list;
    }
}

export function getColorPalette() {
    return ["#FF7F50", "#6495ED", "#DC143C", "#00FFFF", "#8A2BE2", "#A52A2A", "#7FFF00", "#FFD700", "#9932CC", "#00BFFF", "#4B0082", "#2E8B57", "#FF00FF", "#FF4500", "#008080", "#FF1493", "#000080", "#008000", "#FF69B4", "#FF8C00", "#00CED1", "#9400D3", "#ADD8E6", "#800080", "#FFA07A", "#20B2AA", "#87CEFA", "#6B8E23", "#FFB6C1", "#7B68EE", "#4169E1", "#FA8072", "#FAEBD7", "#F0E68C", "#DB7093", "#EEE8AA", "#DA70D6", "#BDB76B", "#8B008B", "#FFA500", "#E6E6FA", "#0000FF", "#D8BFD8", "#F4A460", "#F0FFF0", "#FFFF00", "#FFC0CB", "#40E0D0", "#6A5ACD", "#FF00FF", "#008B8B", "#FFFFF0", "#FFFACD", "#DAF7A6", "#A9A9A9", "#00FA9A", "#FFEFD5", "#CD5C5C", "#7CFC00", "#00FF7F", "#F5DEB3", "#FFE4E1", "#1E90FF", "#BC8F8F", "#66CDAA", "#8FBC8F", "#9400D3", "#7FFFD4", "#FFDAB9", "#00FF00", "#00FFFF", "#FF00FF", "#FAFAD2", "#D2691E", "#FFEBCD", "#FFC0CB", "#D2B48C", "#FF6347", "#B0C4DE", "#C71585", "#FFFFE0", "#00CED1", "#A0522D", "#FFFAF0", "#EEE9E9", "#FFFAFA", "#FFE4B5", "#ADFF2F", "#DB7093", "#E0FFFF", "#F5F5DC", "#FFDAB9", "#FFE4C4", "#DEB887", "#90EE90", "#F08080", "#20B2AA", "#F5DEB3", "#E6E6FA", "#3CB371", '#8B6DDE', '#C44536', '#78B7BB', '#ECA400', '#3B3A3C', '#E85F5C', '#2A9D8F', '#F8EDEB', '#F38181', '#3B3B3B', '#70C1B3', '#F7CAC9', '#E8AEB7', '#547980', '#2F4858', '#33658A', '#86BBD8', '#F7DAD9', '#0F0A3C', '#FDD2B5', '#F2D7EE', '#FF7F11', '#B33951', '#4D4F52', '#BEEB9F', '#6B5B95', '#88B04B', '#D1603D', '#5C5B5A', '#E6B8B7', '#669BBC', '#A2B9BC', '#F8C1C1', '#5F9EA0', '#E58E73', '#CE5A57', '#7FB3D5', '#83AF9B', '#EC9B3B', '#A8A7A7', '#C5DCA0', '#69D2E7', '#F38630', '#C7F464', '#556270', '#EDC9AF', '#CF000F', '#002B36', '#BFBFBF', '#373F51', '#D72638', '#263238', '#F7C59F', '#FF9966', '#EA526F', '#FFB88C', '#A2A2A2', '#00A6ED', '#6F9FD8', '#E6E6E6', '#7366BD', '#FF8C42', '#C4E538', '#4F4F4F', '#F18D9E', '#FFB6C1', '#FA8072', '#FFEFD5', '#EB984E', '#85C7F2', '#F7DC6F', '#E5E5E5', '#C5E1A5', '#F6DDCC', '#3C3C3C', '#00818A', '#DD614A', '#A6ACEC', '#A1C181', '#C5D5EA', '#EB974E', '#A8A8A8', '#BFBFBF', '#FFAE03', '#C1D5E0', '#FCD0A1', '#5C5D5B', '#55ACEE', '#9B59B6', '#6F1E51', '#FFA07A', '#CFCFCF', '#84888B', '#F9D5E5', '#BEBEBE', '#1B1B1B', '#1C1C1C', '#4F4F4F', '#343434', '#2F2F2F',]
}

export function getRandomColor() {
    const colors = getColorPalette();
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}

/**
 * Checks if the value of a specific key or a nested key in a JSON object is `true` based on certain conditions.
 *
 * @param {Object} obj - The JSON object to check the value from.
 * @param {string | string[]} key - The key or array of keys (for nested keys) whose value is to be checked.
 * @param {boolean} [checkBinary=false] - Whether to consider `1` (binary true) as `true`.
 * @param {boolean} [checkYn=false] - Whether to consider `Y`/`y`/`Yes`/`yes` (yes) as `true` and `N`/`n`/`No`/`no` (no) as `false`.
 * @returns {boolean} - Returns `true` if the value satisfies the condition, `false` otherwise.
 *
 * @example 1
 * const obj = { key: true };
 * isJsonValueTrue(obj, 'key'); // true
 *
 * @example 2
 * const obj = { key: 1 };
 * isJsonValueTrue(obj, 'key', true); // true
 *
 * @example 3
 * const obj = { key: 'Y' };
 * isJsonValueTrue(obj, 'key', false, true); // true
 *
 * @example 4
 * const obj = { key: { nestedKey: { more: true } } };
 * isJsonValueTrue(obj, ['key', 'nestedKey', 'more']); // true
 *
 * @example 5
 * const obj = { key: { nestedKey: { more: false } } };
 * isJsonValueTrue(obj, ['key', 'nestedKey', 'more']); // false
 */
export function isJsonValueTrue(obj, key, checkBinary = false, checkYn = false) {
    return isBoolTrue(getJsonValue(obj, key), checkBinary, checkYn);
}

/**
 * Retrieves the value at the specified index in an array.
 * If the array is null or undefined, or the index is out of bounds, a default value is returned.
 *
 * @param {Array} arr - The array from which the value is to be retrieved. Defaults to an empty array if not provided.
 * @param {number} index - The index of the value to retrieve from the array.
 * @param {*} defValue - The default value to return if the array is invalid or the index is out of bounds. Can be any data type.
 * @returns {*} - Returns the value at the specified index, or the default value if the array is invalid or the index is out of bounds.
 *
 * @example 1: Example with a valid array and index
 * const arr = [10, 20, 30];
 * const value = getArrIndexValue(arr, 1);
 * log(value); // Output: 20
 *
 * @example 2: Example with an out-of-bounds index
 * const arr = [10, 20, 30];
 * const value = getArrIndexValue(arr, 5, "Not Found");
 * log(value); // Output: "Not Found"
 *
 * @example 3: Example with an invalid array (null)
 * const value = getArrIndexValue(null, 0, "Default Value");
 * log(value); // Output: "Default Value"
 */
export function getArrIndexValue(arr = [], index, defValue = null) {
    try {
        return checkNullArr(arr) ? getDefStr(arr[index], defValue) : defValue;
        // return arr[index]
    } catch (e) {
        return defValue;
    }
}

/**
 * Retrieves the value of a specified key from a JSON object. If the key is an array, it delegates to `getJsonValueFromNestedKeys` for nested key handling.
 *
 * @param {Object} obj - The JSON object to retrieve the value from.
 * @param {string|Array} key - The key (or array of keys for nested access) to retrieve the value for.
 * @param {*} [defValue=""] - The default value to return if the key is not found or the object is invalid. Defaults to an empty string.
 * @returns {*} - The value of the key if it exists, otherwise the `defValue`.
 *
 * @example 1: Simple key lookup
 * const obj = { name: "John", age: 30 };
 * const result = getJsonValue(obj, "name", "Unknown");
 * log(result); // Output: "John"
 *
 * @example 2: Key not found
 * const obj = { name: "John", age: 30 };
 * const result = getJsonValue(obj, "gender", -1);
 * log(result); // Output: -1
 *
 * @example 3: Nested key lookup
 * const obj = { user: { name: "Alice", details: { age: 25 } } };
 * const result = getJsonValue(obj, ["user", "details", "age"], "Unknown");
 * log(result); // Output: 25
 *
 * @example 4: Dot-separated string nested keys lookup
 * const obj = { user: { name: "Alice", details: { age: 25 } } };
 * const result = getJsonValue(obj, "user.details.age", "Unknown");
 * log(result); // Output: 25
 *
 * @example 5: Invalid object
 * const obj = null;
 * const result = getJsonValue(obj, "name");
 * log(result); // Output: null
 */
export function getJsonValue(obj, key, defValue = "") {
    if (checkNullArr(key) || checkNullArr(String(key).split('.'))) {
        return getJsonValueFromNestedKeys(obj, key, defValue);
    }

    try {
        if (jsonHasKey(obj, key)) return getDefStr(obj[key], defValue);
        if (!checkNullStr((obj[key]))) return defValue;
    } catch (error) {
    }
    return defValue;
}

/**
 * Checks if a JSON object has a specific key.
 *
 * @param {Object} src - The JSON object.
 * @param {string} key - The key to check for.
 * @returns {boolean} - Returns `true` if the key exists, otherwise `false`.
 *
 * @example 1
 * jsonHasKey({ name: "John", age: 30 }, "age"); // true
 *
 * @example 2
 * jsonHasKey({ name: "John" }, "gender"); // false
 */
export function jsonHasKey(src, key) {
    try {
        return src.hasOwnProperty(key);
    } catch (error) {
        return false;
    }
}

export function isValueBool(value) {
    return checkNullStr(value, '') && (value === true || value === 'true' || value === false || value === 'false');
}

/**
 * Concatenates a list of values into a single string using a connector, handling null/undefined values,
 * default returns, and values to skip.
 *
 * @param {Array<string | null | undefined>} srcList - The array of values to concatenate.
 * @param {string} [connector=""] - The string used to join each valid element.
 * @param {string} [defValue=""] - The fallback string returned if no valid values are present.
 * @param {string} [defNullValue=""] - The replacement value for null or undefined elements.
 * @param {Array<string>} [skipValues=[""]] - Values to skip entirely from the concatenation (after defNullValue applied).
 *
 * @returns {string} A concatenated string based on rules and cleanup.
 *
 * @example: 1. Basic join
 * concatStrings(["apple", "banana", "cherry"], ", ");
 * // Output: "apple, banana, cherry"
 *
 * @example: 2. Null/undefined values replaced by a default
 * concatStrings(["apple", null, "cherry"], ", ", "N/A", "-");
 * // Output: "apple, -, cherry"
 *
 * @example: 3. Empty values replaced and connector applied
 * concatStrings(["", "", ""], " - ", "N/A", "N/A");
 * // Output: "N/A - N/A - N/A"
 *
 * @example: 4. Skipping empty strings and nulls
 * concatStrings(["apple", "", null, "banana"], " | ", "N/A", "-", ["", "-"]);
 * // Output: "apple | banana"
 *
 * @example: 5. Mixed types (undefined, strings, null)
 * concatStrings(["John", undefined, "Doe"], " ", "N/A", "?", ["?"]);
 * // Output: "John Doe"
 *
 * @example: 6. All values skipped → fallback default returned
 * concatStrings(["", null, "  "], ", ", "No data", "-", ["", "-", " "]);
 * // Output: "No data"
 *
 * @example: 7. Custom connector without any skip or null handling
 * concatStrings(["One", "Two", "Three"], " / ");
 * // Output: "One / Two / Three"
 *
 * @example: 8. Single valid item
 * concatStrings([null, "OnlyValid", ""], ", ", "Nothing", "-", [""]);
 * // Output: "OnlyValid"
 */
export function concatStrings(srcList = [], connector = "", defValue = "", defNullValue = "", skipValues = ['']) {
    // let outValue = "";
    // if (!checkNullArr(srcList)) return defValue;
    // if (!checkNullArrWithDropEmpty(skipValues)) skipValues = [''];
    // for (let i = 0; i < srcList.length; i++) {
    //     const element = trim(checkNullStr(srcList[i]) ? srcList[i] : '');
    //     if (!checkNullStr(element)) {
    //         if (checkNullArr(skipValues) && !skipValues.includes(defNullValue)) {
    //             outValue += defNullValue;
    //             if (i < srcList.length - 1 && (!skipValues.includes(srcList[i + 1]))) {
    //                 outValue += connector;
    //             }
    //         }
    //     } else if (!skipValues.includes(element)) {
    //         outValue += element;
    //         if (i < srcList.length - 1 && (!skipValues.includes(srcList[i + 1]))) {
    //             outValue += connector;
    //         }
    //     }
    // }
    // if ((outValue + "").trim() === (connector + "").trim()) {
    //     outValue = "";
    // }
    // if ((trim(outValue)[trim(outValue).length - 1]) === trim(connector)) {
    //     outValue = outValue.substring(0, trim(outValue).length - 1);
    // }
    // return trim(checkNullStr(outValue) ? outValue : defValue);

    if (!checkNullArr(srcList)) return defValue;
    if (!checkNullArr(skipValues)) skipValues = [""];

    const result = srcList
        .map((val) => {
            const isNull = !checkNullStr(val);
            const cleanVal = isNull ? defNullValue : String(val).trim();
            return skipValues.includes(cleanVal) ? null : cleanVal;
            // return cleanVal;
        })
        .filter(item => checkNullStr(item));

    return !checkNullArr(result) ? defValue : result.join(connector);
}

export function boolToYN(value, yes = "Yes", no = "No") {
    return isBoolTrue(value) ? yes : no;
}

export function ynToBool(value, yes = "Yes") {
    return (value + "").toLowerCase() === (yes + "").toLowerCase();
}

export function findStrInArr(str, arr, matchCase = true) {
    let found = false;
    if (checkNullStr(str) && checkNullArr(arr) && isArr(arr)) {
        found = arr.includes(isBoolTrue(matchCase) ? str : (str + "").toLowerCase());
    }
    return found;
}

/**
 * Drop duplicate element from the array
 */
export function dropArrDuplicates(arr) {
    return (checkNull(arr) && isArr(arr)) ? arr.filter((elem, index) => arr.indexOf(elem) === index) : arr;
}

export function limitStringWords(str, limit = -1, delimiter = ' ', postfix = "...") {
    const words = (str + "").split(delimiter);
    if (words.length <= limit) return str;
    if (limit >= 0 && words.length >= limit) {
        return words.slice(0, limit).join(delimiter) + postfix;
    }
    return str;
}

export function trim(str) {
    return String(str).trim();
}

export function isEven(number) {
    try {
        const result = parseInt(number)
        return result % 2 === 0;
    } catch (e) {
        return false;
    }
}

export function isNumOdd(number) {
    return parseInteger(number) % 2 !== 0;
}

/**
 * Returns the array length if the object is array otherwise return `defValue`
 */
export function getArrLen(obj = [], defValue = 0) {
    try {
        if (isArr(obj)) {
            return obj.length;
        }
        // len = checkNullArr(arr) ? arr.length : 0;
        // if (checkNullArr(arr)) {
        // if (checkNull(obj) && obj.length > 0) {
        //     len = obj.length;
        // }
    } catch (e) {
    }
    return defValue;
}

/**
 * Converts a JSON object to a string.
 *
 * @param {Object} src - The JSON object to convert.
 * @param {number} [indent=4] - The number of spaces for indentation.
 * @param {Function|null} [replacer=null] - A function to transform values before stringifying.
 * @returns {string} - Returns the JSON object as a string.
 *
 * @example 1
 * jsonToStr({ name: "Alice", age: 25 }); // Returns a formatted JSON string
 */
export function jsonToStr(src, indent = 4, replacer = null) {
    try {
        // data = data.replaceAll("\"", "").replaceAll('"', "");
        return !isStr(src) ? JSON.stringify(src, replacer, indent) : src;
    } catch (e) {
        logErr("jsonToStr:", e);
        return src;
    }
}

export function isStr(obj) {
    try {
        return typeof obj === 'string';
    } catch (e) {
        return false;
    }
}

export function isJson(obj) {
    try {
        const parsed = JSON.parse(obj);
        return true;
    } catch (e) {
        return false;
        // try {
        //     const parsed = JSON.stringify(obj);
        //     return true;
        // } catch (e) {
        //     return false;
        // }
    }
}

/**
 * Executes a callback function with the provided arguments and returns its value.
 *
 * If the callback does not return a value, it will return `null` by default.
 *
 * @param {Function} callback - The function to execute.
 * @param {...any} args - The arguments to pass to the callback function.
 * @returns {any|null} The return value of the callback function, or `null` if it does not return anything.
 *
 * @example 1: Callback with a return value
 * const result = execCallback((a, b) => a + b, 5, 10);
 * log(result); // Output: 15
 *
 * @example 2: Callback without a return value
 * const result = execCallback(() => log('Hello, World!'));
 * log(result); // Output: null
 */
export function execCallback(callback, ...args) {
    return checkFunc(callback) ? callback(...args) : null;
}

/**
 * Checks if the given value is a function.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} - Returns `true` if the value is a function, otherwise `false`.
 *
 * @example 1: Checking a function
 * const func = () => {};
 * const result = checkFunc(func);
 * log(result); // Output: true
 *
 * @example 2: Checking a non-function value
 * const notFunc = 42;
 * const result = checkFunc(notFunc);
 * log(result); // Output: false
 */
export function checkFunc(value) {
    return typeof value === 'function';
}

/**
 * Break a string into its constituent parts.
 *
 * @example
 *     const longString = 'Here is the agenda for our upcoming meeting';
 *     const maxWordLimit = 10;
 *
 *     const formattedString = ellipsizeString(longString, maxWordLimit);
 *     log(formattedString);
 *     //Output: Here is the agenda for our upcoming meeting ...
 *
 * @param {string} inputString - The input string to be formatted.
 * @param {Number} maxWords - The maximum number of characters/words allowed in the output string (default to:10).
 * @param {Boolean} useWords - Whether to use the words or characters to break/split the input string (default to: <code>true</code>).
 * @param {string} postfix - The postfix to added to the output string (default to: ...).
 * @param {string} delimiter - The delimiter to add to the output string (default to: ' '). Its only used when {@link useWords} is <code>true</code>
 * @return {string} - Returns the formatted string.
 */
export function ellipSizeString(inputString, maxWords = 10, useWords = true, postfix = '...', delimiter = ' ') {
    const words = String(inputString).split(isBoolTrue(useWords) ? delimiter : '');
    if (words.length <= maxWords) {
        // If the string has fewer words than the maximum, return it as is
        return inputString;
    } else {
        // If the string has more words than the maximum, truncate and add ellipsis
        const truncatedWords = words.slice(0, maxWords);
        return `${truncatedWords.join(isBoolTrue(useWords) ? delimiter : '')}${postfix}`;
    }
}

export function encodeString(message) {
    // let encodedMessage = btoa(message + '');
    // encodedMessage = encodedMessage.split('').reverse().join('');
    // return encodedMessage;
    try {
        // Attempt to encode directly using btoa
        // return btoa(message + '').split('').reverse().join('');
        return encodeURI(message + '').replace(/%/g, '%25').split('').reverse().join('');
    } catch (error) {
        logErr('encodeString.error:', error);
        // If btoa fails, convert to UTF-8 data URL before encoding
        return encodeURI(message + '').replace(/%/g, '%25').split('').reverse().join('');
    }
}

export function decodeString(encodedMessage) {
    // let decodedMessage = (encodedMessage + '').split('').reverse().join('');
    // decodedMessage = atob(decodedMessage);
    // return decodedMessage;
    try {
        // Attempt to decode directly using atob
        // return atob((encodedMessage + '').split('').reverse().join(''));
        return decodeURI((encodedMessage + '').replace(/%25/g, '%'));
    } catch (error) {
        logErr('decodeString.error:', error);
        // If atob fails, assume data URL encoding and decode accordingly
        return decodeURI((encodedMessage + '').replace(/%25/g, '%'));
    }
}

/**
 * Gets the current system time with AM/PM format, determines the part of the day,
 * and returns an appropriate greeting message.
 *
 * - Use {@link useRealTimeClock} hook to get system's real-time.
 * - This function checks the current system time and based on the hour,
 * - It categorizes the time into morning, afternoon, evening, or night.
 * - It then returns a greeting message that fits the current time.
 *
 * ## How it Works:
 * - Fetch Current Time: The function fetches the current system time using new Date(), which gives us the full date and time.
 * - Determine AM/PM: The function checks if the current hour is greater than or equal to 12 to decide whether it's AM or PM.
 * - Format Time: The time is formatted in hh:mm AM/PM format for clarity (i.e., 12:45 PM).
 *
 * #### Determine Time of Day (Greeting):
 * - Morning: From 5 AM to 11:59 AM.
 * - Afternoon: From 12 PM to 4:59 PM.
 * - Evening: From 5 PM to 7:59 PM.
 * - Night: From 8 PM to 4:59 AM.
 * - Return Greeting:
 * - Depending on the hour, the function returns a suitable greeting: "Good Morning", "Good Afternoon", "Good Evening", or "Good Night", along with the current time.
 *
 * @param {Date} [currDateTime=new Date()] - Current-Date time.
 * @param {boolean} [includeTime=false] - Whether to return time or not.
 * @returns {string} A greeting message such as "Good Morning", "Good Afternoon", "Good Evening", or "Good Night".
 *
 * @example
 * const greeting = getGreetingMessage();
 * log(greeting); // Output could be: "Good Morning" or "Good Evening"
 */
export function getGreetingMessage(currDateTime = new Date(), includeTime = false) {
    try {
        const now = currDateTime || new Date();
        const hours = now.getHours(); // Get the current hour (0-23)
        const minutes = now.getMinutes(); // Get the current minute
        const ampm = hours >= 12 ? "PM" : "AM"; // Determine AM/PM
        const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`; // Format time to hh:mm AM/PM

        // Determine the time of day and return a suitable greeting
        let greeting = "";
        if (hours >= 5 && hours < 12) {
            greeting = "Good Morning";
        } else if (hours >= 12 && hours < 17) {
            greeting = "Good Afternoon";
        } else if (hours >= 17 && hours < 20) {
            greeting = "Good Evening";
        } else {
            greeting = "Good Night";
        }

        // Optional: You can also return the formatted time if you want the time as well
        return `${greeting}${isBoolTrue(includeTime) ? `, the time is ${formattedTime}.` : ''}`;
    } catch (error) {
        console.log(error);
    }
    return "";
}

// =================================Common functions end================================
