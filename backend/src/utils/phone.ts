export const VN_PHONE_REGEX = /^(0[35789][0-9]{8}|\+84[35789][0-9]{8})$/;

export function isValidVietnamPhone(phone: string): boolean {
  return VN_PHONE_REGEX.test(phone.trim());
}

export function normalizeVietnamPhone(phone: string): string {
  const trimmed = phone.trim();
  return trimmed.startsWith('+84') ? `0${trimmed.slice(3)}` : trimmed;
}
