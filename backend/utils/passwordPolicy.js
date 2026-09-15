const COMMON_PASSWORDS = new Set([
  "123456",
  "12345678",
  "password",
  "password123",
  "qwerty",
  "qwerty123",
  "letmein",
]);

export const validateNewPassword = (value) => {
  const password = String(value || "");
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/\d/.test(password)) return "Password must include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character.";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return "Please choose a less common password.";
  return "";
};
