/**
 * Per-route rate limiting configuration.
 * Critical routes (auth, signal ingestion) have stricter limits.
 */

export const rateLimits = {
  // Auth endpoints — prevent brute force
  auth: {
    max: 10,
    timeWindow: '1 minute',
  },

  // Signal ingestion — allow high throughput
  signalIngestion: {
    max: 1000,
    timeWindow: '1 minute',
  },

  // Standard API — moderate limits
  standard: {
    max: 100,
    timeWindow: '1 minute',
  },

  // Billing — very conservative
  billing: {
    max: 20,
    timeWindow: '1 minute',
  },

  // Export — expensive operation
  export: {
    max: 5,
    timeWindow: '1 minute',
  },
} as const;
