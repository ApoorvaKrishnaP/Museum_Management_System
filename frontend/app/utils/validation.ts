/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Email validation function
 * 
 * Validates email format using regex:
 * - At least one character before @
 * - @ symbol must be present
 * - Valid domain after @
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password validation function
 * 
 * Validates password strength:
 * - Must be longer than 8 characters
 * 
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password length > 8, false otherwise
 */
export function isValidPassword(password: string): boolean {
  return password.length > 8;
}

/**
 * Combined validation for signup form
 * 
 * @param {string} name - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {ValidationResult} - { isValid: boolean, errors: array }
 */
export function validateSignup(name: string, email: string, password: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push("Name is required.");
  }

  if (!email || email.trim().length === 0) {
    errors.push("Email is required.");
  } else if (!isValidEmail(email)) {
    errors.push("Please enter a valid email address.");
  }

  if (!password || password.length === 0) {
    errors.push("Password is required.");
  } else if (!isValidPassword(password)) {
    errors.push("Password must be longer than 8 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

/**
 * Combined validation for login form
 * 
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {ValidationResult} - { isValid: boolean, errors: array }
 */
export function validateLogin(email: string, password: string): ValidationResult {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push("Email is required.");
  } else if (!isValidEmail(email)) {
    errors.push("Please enter a valid email address.");
  }

  if (!password || password.length === 0) {
    errors.push("Password is required.");
  } else if (!isValidPassword(password)) {
    errors.push("Password must be longer than 8 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}