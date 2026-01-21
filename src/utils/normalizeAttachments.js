/**
 * Normalizes attachments to ensure they are always an array of {name, url} objects.
 * Handles multiple input formats:
 * - Array of objects: [{name: "...", url: "..."}]
 * - Array of strings: ["Name — URL", "Name - URL"]
 * - Multiline text with bullet points
 *
 * @param {any} input - Raw attachment data in various formats
 * @returns {Array<{name: string, url: string}>} Normalized attachments
 */
export function normalizeAttachments(input) {
  // Handle null/undefined
  if (!input) return [];

  let items = [];

  // If already array of objects with name/url, validate and return
  if (Array.isArray(input)) {
    // Check if it's already in correct format
    if (input.length > 0 && typeof input[0] === "object" && "url" in input[0]) {
      return input
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          name: (item.name || "Attachment").trim(),
          url: (item.url || "").trim(),
        }));
    }

    // It's an array of strings or mixed
    items = input.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item.name && item.url)
        return `${item.name} — ${item.url}`;
      return String(item);
    });
  } else if (typeof input === "string") {
    // Single string or multiline
    items = input.split(/[\n\r]+/);
  } else if (typeof input === "object" && input.name && input.url) {
    // Single object {name, url}
    return [
      {
        name: input.name.trim(),
        url: input.url.trim(),
      },
    ];
  } else {
    return [];
  }

  // Parse each item
  const result = [];
  for (const item of items) {
    const str = String(item).trim();
    if (!str) continue;

    // Try to extract "Name — URL" or "Name - URL" format
    const dashMatch = str.match(/^([^—\-]+?)\s+(?:—|[-])\s+(.+)$/);
    if (dashMatch) {
      const [, name, url] = dashMatch;
      result.push({
        name: name.trim(),
        url: url.trim(),
      });
      continue;
    }

    // Try to extract "Name: URL" format
    const colonMatch = str.match(/^([^:]+?):\s*(.+)$/);
    if (colonMatch) {
      const [, name, url] = colonMatch;
      result.push({
        name: name.trim(),
        url: url.trim(),
      });
      continue;
    }

    // Check if it's just a URL
    if (str.startsWith("http://") || str.startsWith("https://")) {
      result.push({
        name: "Attachment",
        url: str,
      });
      continue;
    }

    // Treat as name with empty URL
    result.push({
      name: str,
      url: "",
    });
  }

  return result;
}

/**
 * Validates attachment structure for backend submission
 * @param {Array<{name: string, url: string}>} attachments - Normalized attachments
 * @returns {Array<{name: string, url: string}>} Valid attachments (filters out invalid ones)
 */
export function validateAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter((att) => {
      // At minimum, must have name or url
      const hasContent = (att.name && att.name.trim()) || (att.url && att.url.trim());
      return hasContent;
    })
    .map((att) => ({
      name: (att.name || "Attachment").trim(),
      url: (att.url || "").trim(),
    }));
}

/**
 * Logs attachment transformation for debugging
 * @param {any} input - Original input
 * @param {Array<{name: string, url: string}>} normalized - After normalization
 * @param {string} context - Where this was called from
 */
export function debugLogAttachments(input, normalized, context = "attachments") {
  if (import.meta.env.DEV) {
    console.group(`[${context}] Attachment Normalization`);
    console.log("Input:", input);
    console.log("Output:", normalized);
    console.groupEnd();
  }
}
