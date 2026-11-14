/**
 * Unified Vietnamese Tone Removal & Text Normalization Utility (Server-side)
 * Re-exports everything from searchUtils.js for unified standard and backward compatibility.
 */
export * from './searchUtils.js';
export { removeVietnameseTones as default } from './searchUtils.js';
