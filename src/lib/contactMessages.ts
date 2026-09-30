/**
 * KRYTY Standardized Contextual Contact Message & Deep-Link Generator
 * Supports Teacher General Contact, Product Specific Contact, and Institution Contact.
 */

export function getTeacherContactMessage(teacherName: string): string {
  return `مرحباً أستاذ ${teacherName}، وجدتك في منصة PROF DZ وأود الاستفسار عن الدروس.`;
}

export function getProductContactMessage(creatorName: string, productTitle: string): string {
  return `مرحبًا، أود الاستفسار عن المورد «${productTitle}» الموجود على منصة قراتي.`;
}

/**
 * @deprecated Legacy institution contact fallback
 */
export function getInstitutionContactMessage(institutionName: string): string {
  return `مرحباً، وجدت ملفكم ${institutionName} على منصة PROF DZ وأود الاستفسار.`;
}

/**
 * Format a valid WhatsApp click-to-chat deep link
 */
export function formatWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Format a valid Telegram deep link.
 * If a username is configured, opens the direct chat with pre-composed message context.
 */
export function formatTelegramLink(telegram: string, message: string): string {
  let cleanUsername = telegram.trim();
  cleanUsername = cleanUsername.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '');
  
  if (!cleanUsername) return '';

  const encodedText = encodeURIComponent(message);
  // Telegram link format with prefilled text
  return `https://t.me/${cleanUsername}?text=${encodedText}`;
}
