export const VN_PHONE_REGEX = /^(0[35789][0-9]{8}|\+84[35789][0-9]{8})$/;

export function isValidVietnamPhone(phone: string): boolean {
  return VN_PHONE_REGEX.test(phone.trim());
}
