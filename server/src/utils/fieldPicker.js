/**
 * Utility for Sparse Fieldsets (Dynamic Field Selection)
 * Allows clients to request only specific fields: ?fields=name,cost,regions...
 */

export const pickFields = (item, fieldsStr, primaryKey = null) => {
  if (!fieldsStr || !item || typeof item !== 'object') {
    return item;
  }

  const requestedFields = String(fieldsStr)
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  if (requestedFields.length === 0) {
    return item;
  }

  const picked = {};

  // Always retain primary ID/Code key if provided
  if (primaryKey && item[primaryKey] !== undefined) {
    picked[primaryKey] = item[primaryKey];
  }

  requestedFields.forEach((field) => {
    // Support simple property access
    if (item[field] !== undefined) {
      picked[field] = item[field];
    }
  });

  return picked;
};

export const pickListFields = (list, fieldsStr, primaryKey = null) => {
  if (!fieldsStr || !Array.isArray(list)) {
    return list;
  }

  const requested = String(fieldsStr)
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  if (requested.length === 0) {
    return list;
  }

  return list.map((item) => pickFields(item, fieldsStr, primaryKey));
};