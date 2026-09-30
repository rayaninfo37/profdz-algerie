/**
 * Canonical Algerian Mobile Phone Validation & Normalization
 * Standard: 10 digits starting with 05 (Ooredoo), 06 (Mobilis), or 07 (Djezzy)
 * Regex: /^0[567][0-9]{8}$/
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalizedPhone: string;
  error?: string;
}

/**
 * Normalizes Algerian phone numbers:
 * - strips whitespace, hyphens, dots, parentheses
 * - converts +213 or 00213 prefix to leading 0
 * - converts 9 digits starting with 5, 6, 7 to 10 digits starting with 0
 */
export function normalizeAlgerianPhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).trim().replace(/[\s\-\.\(\)]/g, '');

  // Convert international prefixes (+213 or 00213) to national leading 0
  if (cleaned.startsWith('+213')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('00213')) {
    cleaned = '0' + cleaned.slice(5);
  } else if (cleaned.length === 9 && /^[567]/.test(cleaned)) {
    // Missing leading zero
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

/**
 * Validates Algerian mobile phone number strictly.
 * Returns isValid: true and normalized string, or isValid: false and Arabic error message.
 */
export function validateAlgerianPhone(rawPhone: string | null | undefined, isRequired = false): PhoneValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    if (isRequired) {
      return {
        isValid: false,
        normalizedPhone: '',
        error: 'رقم الهاتف مطلوب.',
      };
    }
    return {
      isValid: true,
      normalizedPhone: '',
    };
  }

  const normalized = normalizeAlgerianPhone(rawPhone);

  // Must contain digits only
  if (!/^\d+$/.test(normalized)) {
    return {
      isValid: false,
      normalizedPhone: normalized,
      error: 'رقم الهاتف يجب أن يحتوي على أرقام فقط.',
    };
  }

  // Exactly 10 digits starting with 05, 06, or 07
  const algerianMobileRegex = /^0[567][0-9]{8}$/;
  if (!algerianMobileRegex.test(normalized)) {
    if (normalized.length !== 10) {
      return {
        isValid: false,
        normalizedPhone: normalized,
        error: `رقم الهاتف يجب أن يتكون من 10 أرقام (الرقم المدخل: ${normalized.length} أرقام).`,
      };
    }
    return {
      isValid: false,
      normalizedPhone: normalized,
      error: 'رقم الهاتف الجزائري يجب أن يبدأ بـ 05 (Ooredoo) أو 06 (Mobilis) أو 07 (Djezzy).',
    };
  }

  return {
    isValid: true,
    normalizedPhone: normalized,
  };
}
