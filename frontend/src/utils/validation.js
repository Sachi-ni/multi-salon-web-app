const EMAIL_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,63}$/;
const GENERIC_PHONE_PATTERN = /^\+?[0-9]{10}$/;
const SRI_LANKAN_PHONE_PATTERN = /^(?:\+94|0)\d{9}$/;
const COMMON_PASSWORDS = new Set(["123456", "12345678", "password", "password123", "qwerty", "qwerty123", "letmein"]);
const SUPPORTED_EMAIL_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]);

export const normalizePhone = (value = "") => String(value).trim().replace(/[\s()-]/g, "");

export const validateEmail = (value = "", { enforceProviderRules = true } = {}) => {
  const enteredEmail = String(value).trim();
  if (!enteredEmail) return { valid: false, message: "Email is required." };
  if (enteredEmail !== enteredEmail.toLowerCase()) {
    return { valid: false, message: "Email address must use lowercase letters only." };
  }

  const email = enteredEmail;
  if (!EMAIL_PATTERN.test(email)) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  const [, domain] = email.split("@");
  if (enforceProviderRules && !SUPPORTED_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, message: "Use a Gmail, Yahoo, Outlook, or Hotmail email address." };
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
  if (password.length < 6) return { valid: false, message: "Password must be at least 6 characters long." };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must include at least one uppercase letter." };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must include at least one lowercase letter." };
  if (!/[^A-Za-z]/.test(password)) return { valid: false, message: "Password must include at least one number or special character." };
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return { valid: false, message: "Please choose a less common password." };
  return { valid: true, message: "" };
};

export const validateConfirmPassword = (password = "", confirmPassword = "") => {
  if (!confirmPassword) return { valid: false, message: "Please confirm your password." };
  return password === confirmPassword
    ? { valid: true, message: "" }
    : { valid: false, message: "Passwords do not match." };
};
