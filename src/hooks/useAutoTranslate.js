/**
 * useAutoTranslate Hook
 * Automatically translates UI strings without requiring manual translation keys
 * Features:
 * - Dual-layer caching (localStorage + backend MongoDB)
 * - Batch translation for performance
 * - Smart skip logic for emails, URLs, IDs, numbers, dates
 * - Graceful fallback to original text on error
 * - localStorage persistence for offline access
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getCachedTranslation, cacheTranslation } from '../utils/translationCache';

import { API_BASE_URL } from '../utils/apiPaths';
const BATCH_SIZE = 20;
const BATCH_DELAY = 500; // ms
const REQUEST_TIMEOUT = 5000; // ms

/**
 * Should skip translation for this text?
 * Skip: emails, URLs, IDs, numbers, dates, very short strings
 */
const shouldSkipTranslation = (text) => {
  if (!text || typeof text !== 'string') return true;
  if (text.length < 2) return true;

  // Email pattern
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return true;

  // URL pattern
  if (/^https?:\/\/|www\.|\.com|\.org|\.net/.test(text)) return true;

  // UUID/ID pattern
  if (/^[a-f0-9\-]{36}$|^[a-f0-9]{24}$/.test(text)) return true;

  // Phone number pattern
  if (/^\+?[\d\s\-\(\)]{8,}$/.test(text)) return true;

  // Date pattern (YYYY-MM-DD, DD/MM/YYYY, etc.)
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$|^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(text)) return true;

  // All numbers or mostly numbers
  if (/^[\d\s\.,]+$/.test(text)) return true;

  // Currency
  if (/^[\$€£¥₹₽]|^(USD|EUR|GBP|JPY|INR)$/.test(text)) return true;

  // File extensions or paths
  if (/\.[a-z]{2,4}$|\//.test(text)) return true;

  // Already Arabic (skip re-translating)
  if (/[\u0600-\u06FF]/.test(text)) return true;

  return false;
};

/**
 * Main hook for automatic translation
 */
export const useAutoTranslate = () => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const batchQueue = useRef(new Map()); // Map of text -> Promise
  const batchTimerId = useRef(null);
  const requestController = useRef(new AbortController());

  /**
   * Translate a single text
   */
  const tr = useCallback(
    async (text, context = null) => {
      // Not translating if language is not Arabic
      if (i18n.language !== 'ar') {
        return text;
      }

      // Skip non-translatable text
      if (shouldSkipTranslation(text)) {
        return text;
      }

      // Check localStorage cache first
      const cached = getCachedTranslation(text);
      if (cached) {
        return cached;
      }

      // Queue for batch translation
      if (!batchQueue.current.has(text)) {
        batchQueue.current.set(
          text,
          new Promise((resolve) => {
            batchQueue.current.set(text, { resolve, reject: resolve });
          })
        );

        // Schedule batch request
        if (batchQueue.current.size === 1) {
          clearTimeout(batchTimerId.current);
          batchTimerId.current = setTimeout(() => {
            processBatch();
          }, BATCH_DELAY);
        }

        // Send batch early if queue is full
        if (batchQueue.current.size >= BATCH_SIZE) {
          clearTimeout(batchTimerId.current);
          processBatch();
        }
      }

      // Wait for translation
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const cached = getCachedTranslation(text);
          if (cached) {
            clearInterval(checkInterval);
            resolve(cached);
          }
        }, 50);

        setTimeout(() => {
          clearInterval(checkInterval);
          const cached = getCachedTranslation(text);
          resolve(cached || text);
        }, 3000);
      });
    },
    [i18n.language]
  );

  /**
   * Process batch of texts to translate
   */
  const processBatch = useCallback(async () => {
    if (batchQueue.current.size === 0) return;

    const texts = Array.from(batchQueue.current.keys());
    const promises = Array.from(batchQueue.current.values());

    // Clear queue
    batchQueue.current.clear();

    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}/translate`,
        {
          texts,
          targetLang: 'ar',
        },
        {
          timeout: REQUEST_TIMEOUT,
          signal: requestController.current.signal,
        }
      );

      const { translations } = response.data;

      // Cache each translation
      texts.forEach((text) => {
        const translated = translations[text] || text;
        cacheTranslation(text, translated);
      });

      setIsLoading(false);
    } catch (err) {
      console.warn('Auto-translation error:', err.message);
      setError(err.message);
      // Return original texts on error
      texts.forEach((text) => {
        cacheTranslation(text, text); // Cache original as fallback
      });
    }
  }, []);

  /**
   * Translate array of texts directly (useful for bulk operations)
   */
  const trBatch = useCallback(
    async (texts) => {
      if (i18n.language !== 'ar') {
        return Object.fromEntries(texts.map((text) => [text, text]));
      }

      const toTranslate = texts.filter((text) => !shouldSkipTranslation(text));

      if (toTranslate.length === 0) {
        return Object.fromEntries(texts.map((text) => [text, text]));
      }

      try {
        setIsLoading(true);
        const response = await axios.post(
          `${API_BASE_URL}/translate`,
          {
            texts: toTranslate,
            targetLang: 'ar',
          },
          {
            timeout: REQUEST_TIMEOUT,
            signal: requestController.current.signal,
          }
        );

        const { translations } = response.data;

        // Cache each translation
        toTranslate.forEach((text) => {
          const translated = translations[text] || text;
          cacheTranslation(text, translated);
        });

        // Build result with all texts (cached + just translated)
        const result = {};
        texts.forEach((text) => {
          result[text] = getCachedTranslation(text) || text;
        });

        setIsLoading(false);
        return result;
      } catch (err) {
        console.warn('Batch translation error:', err.message);
        setError(err.message);
        return Object.fromEntries(texts.map((text) => [text, text]));
      }
    },
    [i18n.language]
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearTimeout(batchTimerId.current);
      requestController.current.abort();
    };
  }, []);

  return {
    tr,
    trBatch,
    isLoading,
    error,
    currentLanguage: i18n.language,
    isArabic: i18n.language === 'ar',
  };
};

export default useAutoTranslate;
