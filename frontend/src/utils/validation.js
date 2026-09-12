const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,63}$/;
const GENERIC_PHONE_PATTERN = /^\+?[0-9]{10}$/;
const SRI_LANKAN_PHONE_PATTERN = /^(?:\+94|0)\d{9}$/;
const COMMON_PASSWORDS = new Set(["123456", "12345678", "password", "password123", "qwerty", "qwerty123", "letmein"]);
const GMAIL_DOMAINS = new Set(["gmail.com"]);
const GMAIL_LOCAL_PART_PATTERN = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*$/;

export const normalizePhone = (value = "") => String(value).trim().replace(/[\s()-]/g, "");

export const validateEmail = (value = "", { enforceProviderRules = true } = {}) => {
  const email = String(value).trim().toLowerCase();
  if (!email) return { valid: false, message: "Email is required." };
  if (!EMAIL_PATTERN.test(email)) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  const [localPart, domain] = email.split("@");
  if (enforceProviderRules && GMAIL_DOMAINS.has(domain)) {
    if (!GMAIL_LOCAL_PART_PATTERN.test(localPart)) {
      return { valid: false, message: "Gmail addresses may use only letters, numbers, and single periods." };
    }
  }

  return { valid: true, message: "" };
};

export const validatePhoneGeneric = (value = "") => {
  const phone = normalizePhone(value);
  if (!phone) return { valid: false, message: "Phone number is required." };
  return GENERIC_PHONE_PATTERN.test(phone)
    ? { valid: true, message: "" }
    : { valid: false, message: "Phone number must contain exactly 10 digits and may start with +." };
};

export const validatePhoneSriLankan = (value = "") => {
  const phone = normalizePhone(value);
  if (!phone) return { valid: false, message: "Phone number is required." };
  return SRI_LANKAN_PHONE_PATTERN.test(phone)
    ? { valid: true, message: "" }
    : { valid: false, message: "Enter a valid Sri Lankan phone number, such as 0771234567 or +94771234567." };
};

export const validatePassword = (value = "") => {
  const password = String(value);
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters long." };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must include at least one uppercase letter." };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must include at least one lowercase letter." };
  if (!/\d/.test(password)) return { valid: false, message: "Password must include at least one number." };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: "Password must include at least one special character." };
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return { valid: false, message: "Please choose a less common password." };
  return { valid: true, message: "" };
};

export const validateConfirmPassword = (password = "", confirmPassword = "") => {
  if (!confirmPassword) return { valid: false, message: "Please confirm your password." };
  return password === confirmPassword
    ? { valid: true, message: "" }
    : { valid: false, message: "Passwords do not match." };
};
