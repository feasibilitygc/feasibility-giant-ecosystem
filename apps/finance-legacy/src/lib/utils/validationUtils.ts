/**
 * Validates if a phone number matches the Nigerian format.
 * Matches backend `PhoneNumberService.isValidNigerianNumber`.
 */
export const isValidNigerianNumber = (value: string): boolean => {
  if (!value) return false;
  // Clean the number (remove whitespaces)
  const cleaned = value.replace(/\s+/g, '');
  // Match formats: 0703..., +234703..., or 234703...
  const nigerianPattern = /^(?:(?:\+?234)|0)([789][01])\d{8}$/;
  return nigerianPattern.test(cleaned);
};

/**
 * Validates if an email matches a standard valid email format.
 * Matches backend Zod `email()` validation behavior.
 */
export const isValidEmail = (value: string): boolean => {
  if (!value) return false;
  // Standard robust email regex matching standard zod email() pattern
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(value);
};
