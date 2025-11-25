/**
 * Subscription utility functions and constants
 */

// Subscription type to available categories mapping
export const SUBSCRIPTION_CATEGORIES = {
  Free: ["Survival", "Safety"],
  Premium: ["Social", "Self"],
  Coach: ["Survival", "Safety", "Social", "Self", "Meta-Needs"],
};

// Subscription pricing (in USD)
export const SUBSCRIPTION_PRICING = {
  Free: 0,
  Premium: 19,
  Coach: 39,
};

// Valid subscription types
export const SUBSCRIPTION_TYPES = ["Free", "Premium", "Coach"];

// Valid categories
export const VALID_CATEGORIES = ["Survival", "Safety", "Social", "Self", "Meta-Needs"];

// Default categories for non-authenticated users (Free plan)
export const DEFAULT_CATEGORIES = ["Survival", "Safety"];

/**
 * Get available categories for a subscription type
 * @param {string} subscriptionType - Subscription type (Free, Premium, Coach)
 * @returns {string[]} Array of available categories
 */
export const getCategoriesForSubscription = (subscriptionType) => {
  if (!SUBSCRIPTION_TYPES.includes(subscriptionType)) {
    return DEFAULT_CATEGORIES;
  }
  return SUBSCRIPTION_CATEGORIES[subscriptionType] || DEFAULT_CATEGORIES;
};

/**
 * Get pricing for a subscription type
 * @param {string} subscriptionType - Subscription type (Free, Premium, Coach)
 * @returns {number} Price in USD
 */
export const getPricingForSubscription = (subscriptionType) => {
  if (!SUBSCRIPTION_TYPES.includes(subscriptionType)) {
    return 0;
  }
  return SUBSCRIPTION_PRICING[subscriptionType] || 0;
};

/**
 * Validate if categories are valid for a subscription type
 * @param {string[]} categories - Categories to validate
 * @param {string} subscriptionType - Subscription type
 * @returns {Object} Validation result with isValid and invalidCategories
 */
export const validateCategoriesForSubscription = (categories, subscriptionType) => {
  if (!Array.isArray(categories)) {
    return {
      isValid: false,
      invalidCategories: [],
      message: "Categories must be an array",
    };
  }

  const availableCategories = getCategoriesForSubscription(subscriptionType);
  const invalidCategories = categories.filter((cat) => !availableCategories.includes(cat));

  // Also validate category names
  const invalidCategoryNames = categories.filter((cat) => !VALID_CATEGORIES.includes(cat));

  if (invalidCategoryNames.length > 0) {
    return {
      isValid: false,
      invalidCategories: invalidCategoryNames,
      message: `Invalid category names: ${invalidCategoryNames.join(", ")}`,
    };
  }

  if (invalidCategories.length > 0) {
    return {
      isValid: false,
      invalidCategories,
      message: `Categories not available for ${subscriptionType} subscription: ${invalidCategories.join(", ")}. Available: ${availableCategories.join(", ")}`,
    };
  }

  return {
    isValid: true,
    invalidCategories: [],
    message: "All categories are valid",
  };
};

/**
 * Check if a category is available for a subscription type
 * @param {string} category - Category to check
 * @param {string} subscriptionType - Subscription type
 * @returns {boolean} True if category is available
 */
export const isCategoryAvailable = (category, subscriptionType) => {
  const availableCategories = getCategoriesForSubscription(subscriptionType);
  return availableCategories.includes(category);
};

/**
 * Get subscription info object
 * @param {string} subscriptionType - Subscription type
 * @returns {Object} Subscription info with type, categories, and pricing
 */
export const getSubscriptionInfo = (subscriptionType = "Free") => {
  return {
    subscriptionType,
    availableCategories: getCategoriesForSubscription(subscriptionType),
    pricing: getPricingForSubscription(subscriptionType),
  };
};


