/**
 * <T> Component - Automatic Translation Wrapper
 * Wraps text to automatically translate it when language is Arabic
 * 
 * Usage:
 * <T>Dashboard</T>
 * <T context="admin">User Management</T>
 * 
 * Features:
 * - Automatic translation on mount and when language changes
 * - Shows original text while translation is loading
 * - Caches translations for performance
 * - Skips non-translatable content (emails, URLs, IDs, numbers)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getCachedTranslation, cacheTranslation } from '../utils/translationCache';
import axios from 'axios';

import { API_BASE_URL } from '../utils/apiPaths';

/**
 * Should skip translation for this text?
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

  // Date pattern
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$|^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(text)) return true;

  // All numbers or mostly numbers
  if (/^[\d\s\.,]+$/.test(text)) return true;

  // Currency
  if (/^[\$€£¥₹₽]|^(USD|EUR|GBP|JPY|INR)$/.test(text)) return true;

  // File extensions or paths
  if (/\.[a-z]{2,4}$|\//.test(text)) return true;

  // Already Arabic
  if (/[\u0600-\u06FF]/.test(text)) return true;

  return false;
};

/**
 * T Component
 */
const T = React.forwardRef(({ children, className = '', context = null, as = 'span', ...props }, ref) => {
  const { i18n } = useTranslation();
  const [translated, setTranslated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract text content from children
  const text = useMemo(() => {
    if (typeof children === 'string') {
      return children;
    }
    if (React.isValidElement(children)) {
      return children.props?.children || '';
    }
    return String(children || '');
  }, [children]);

  // Effect: Translate when language changes or text changes
  useEffect(() => {
    // Don't translate if not Arabic
    if (i18n.language !== 'ar') {
      setTranslated(null);
      return;
    }

    // Skip non-translatable text
    if (shouldSkipTranslation(text)) {
      setTranslated(null);
      return;
    }

    // Check cache first
    const cached = getCachedTranslation(text);
    if (cached) {
      setTranslated(cached);
      return;
    }

    // Request translation
    setIsLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    axios
      .post(
        `${API_BASE_URL}/translate`,
        {
          text,
          targetLang: 'ar',
        },
        {
          signal: controller.signal,
        }
      )
      .then((response) => {
        const { translated: translatedText } = response.data;
        cacheTranslation(text, translatedText);
        setTranslated(translatedText);
        setIsLoading(false);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.warn('Translation error:', error.message);
        }
        // Fallback to original text
        cacheTranslation(text, text);
        setTranslated(null);
        setIsLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [text, i18n.language]);

  // Determine what to display
  const displayText = translated || text;
  const finalClassName = `${className} ${isLoading ? 'opacity-70' : ''}`.trim();

  // If using default span
  if (as === 'span') {
    return (
      <span ref={ref} className={finalClassName} title={isLoading ? 'Translating...' : ''} {...props}>
        {displayText}
      </span>
    );
  }

  // If using custom element
  const Element = as;
  return (
    <Element ref={ref} className={finalClassName} title={isLoading ? 'Translating...' : ''} {...props}>
      {displayText}
    </Element>
  );
});

T.displayName = 'T';

export default T;
