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
  if (password.length < 6) return "Password must be at least 6 characters long.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/[^A-Za-z]/.test(password)) return "Password must include at least one number or special character.";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return "Please choose a less common password.";
  return "";
};
