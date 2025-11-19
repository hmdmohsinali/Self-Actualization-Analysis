/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long",
    };
  }
  return { isValid: true, message: "Password is valid" };
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return {
      isValid: false,
      message: "Name must be at least 2 characters long",
    };
  }
  if (name.trim().length > 50) {
    return {
      isValid: false,
      message: "Name must be less than 50 characters",
    };
  }
  return { isValid: true, message: "Name is valid" };
};

