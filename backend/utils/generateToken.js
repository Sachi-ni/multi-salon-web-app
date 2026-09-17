import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user?._id || user,
      role: user?.role,
      salon_id: user?.salon_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export const generateHardeningToken = (user, purpose) => jwt.sign(
  {
    id: user._id,
    role: user.role,
    purpose,
  },
  process.env.JWT_SECRET,
  { expiresIn: "15m" }
);

export const generatePending2FaToken = (user) => jwt.sign(
  {
    id: user._id,
    role: user.role,
    purpose: "superadmin-2fa",
  },
  process.env.JWT_SECRET,
  { expiresIn: "10m" }
);

// This scope is deliberately distinct from hardening tokens (change-password,
// mfa-setup) so a token from either flow can never authorize the other.
export const generatePasswordResetSessionToken = (user) => jwt.sign(
  {
    id: user._id,
    role: user.role,
    purpose: "password_reset",
    jti: crypto.randomBytes(16).toString("hex"),
  },
  process.env.JWT_SECRET,
  { expiresIn: "10m" }
);

export const hashPasswordResetSessionToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export default generateToken;
