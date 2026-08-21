import { z } from "zod";

/**
 * Query parameter helper for string arrays.
 * Accepts both single strings and arrays, normalizes to array.
 * Useful for query params like ?ids=1 or ?ids=1&ids=2
 */
export const query_string_array = (schema: z.ZodString = z.string().min(1)) => {
  return z.preprocess((val) => (val !== undefined && !Array.isArray(val) ? [val] : val), z.array(schema).min(1));
};

/**
 * Query parameter helper for booleans.
 * Converts string "true"/"false" to actual booleans.
 * Useful for query params like ?active=true
 */
export const query_boolean = () => {
  return z.preprocess((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return val;
  }, z.boolean());
};

/**
 * Query parameter helper for numbers.
 * Converts string numbers to actual numbers.
 * Useful for query params like ?limit=10
 */
export const query_number = (schema: z.ZodNumber = z.number()) => {
  return z.preprocess((val) => {
    if (typeof val === "string") {
      const parsed = Number(val);
      return isNaN(parsed) ? val : parsed;
    }
    return val;
  }, schema);
};

/**
 * Query parameter helper for numbers.
 * Converts string numbers to actual numbers.
 * Useful for query params like ?limit=10
 */
export const query_number_array = (schema: z.ZodNumber = z.number()) => {
  return z.preprocess((val) => {
    if (val !== undefined && !Array.isArray(val)) {
      return [Number(val)];
    } else if (val !== undefined && Array.isArray(val)) {
      return val.map((v) => Number(v));
    }
    return val;
  }, z.array(schema).min(1));
};

/**
 * Query parameter helper for enums.
 * Converts string enums to actual enums.
 * Useful for query params like ?type=PAINT
 */
export const query_enum_array = <T extends z.ZodTypeAny>(schema: T) => {
  return z.preprocess((val) => (val !== undefined && !Array.isArray(val) ? [val] : val), z.array(schema).min(1));
};
