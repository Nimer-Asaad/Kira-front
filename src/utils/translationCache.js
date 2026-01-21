/**
 * Frontend Translation Cache
 * Manages localStorage caching for translated strings
 */

const CACHE_KEY_PREFIX = 'kira_translation_';
const CACHE_VERSION = 1;
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Generate cache key for a text
 */
export const getCacheKey = (text) => {
  return `${CACHE_KEY_PREFIX}${text.toLowerCase().slice(0, 50)}`;
};

/**
 * Get translation from cache
 */
export const getCachedTranslation = (text) => {
  try {
    const key = getCacheKey(text);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { translated, timestamp } = JSON.parse(cached);

    // Check if cache expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }

    return translated;
  } catch (error) {
    console.warn('Error reading translation cache:', error);
    return null;
  }
};

/**
 * Set translation in cache
 */
export const cacheTranslation = (text, translated) => {
  try {
    const key = getCacheKey(text);
    localStorage.setItem(
      key,
      JSON.stringify({
        text,
        translated,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.warn('Error writing to translation cache:', error);
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old translations');
      clearOldTranslations();
    }
  }
};

/**
 * Clear old translations when quota is exceeded
 */
export const clearOldTranslations = () => {
  try {
    const keys = Object.keys(localStorage)
      .filter((key) => key.startsWith(CACHE_KEY_PREFIX))
      .slice(0, 100); // Clear oldest 100 entries

    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Clear all translation cache
 */
export const clearAllTranslations = () => {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CACHE_KEY_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing all translations:', error);
  }
};

export default {
  getCacheKey,
  getCachedTranslation,
  cacheTranslation,
  clearOldTranslations,
  clearAllTranslations,
};
