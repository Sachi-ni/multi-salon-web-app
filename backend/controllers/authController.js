import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";
import Customer from "../models/Customer.js";
import Salon from "../models/Salon.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateToken, { generateHardeningToken, generatePending2FaToken } from "../utils/generateToken.js";
import { storeMedia } from "../utils/mediaStorage.js";
import { assertNotPrivilegedRole } from "../utils/roleGuard.js";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  sendPasswordResetEmail,
} from "../utils/passwordReset.js";
import {
  generateOtpCode,
  hashOtpCode,
  maskEmail,
  sendSuperAdminOtpEmail,
  OTP_EXPIRATION_MS,
  OTP_RESEND_COOLDOWN_MS,
  MAX_OTP_ATTEMPTS,
} from "../utils/emailOtp.js";


const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{3,63}$/;
const PHONE_PATTERN = /^\+?[0-9]{10}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
const COMMON_PASSWORDS = new Set(["12345678", "password", "password123", "qwerty123", "letmein"]);
const GENERIC_RESET_MESSAGE = "If an account exists, a reset link has been sent.";

const validateProfileFields = ({ email, phone, password, username }) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = phone?.replace(/[\s()-]/g, "");

  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    return { message: "Please enter a valid email address" };
  }
  if (normalizedPhone && !PHONE_PATTERN.test(normalizedPhone)) {
    return { message: "Phone number must contain exactly 10 digits and may start with +" };
  }
  if (password && !PASSWORD_PATTERN.test(password)) {
    return { message: "Password must be at least 6 characters and include uppercase, lowercase, and number" };
  }
  if (password && COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { message: "Please choose a less common password" };
  }
  if (password && username && password.toLowerCase().includes(username.trim().toLowerCase())) {
    return { message: "Password must not contain your username" };
  }
  return { normalizedEmail, normalizedPhone };
};

export const getProfile = async (req, res) => {
  try {
    let user = await Admin.findById(req.user.id).select("-password");
    let nameField = "full_name";

    if (!user) {
      user = await Staff.findById(req.user.id).select("-password_hash");
      nameField = "full_name";
    }
    if (!user) {
      user = await Customer.findById(req.user.id).select("-password_hash");
      nameField = "name";
    }
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user[nameField] || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      image: user.image || "",
      role: user.role,
      salon_id: user.salon_id || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, phone, password, preferredSalonId, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.replace(/[\s()-]/g, "");

    // This public route can only create customers; privileged roles must never be self-registered.
    if (role && role.toLowerCase() !== "customer") {
      return res.status(400).json({ message: "Only customer registration is allowed" });
    }
    assertNotPrivilegedRole(role);

    const validation = validateProfileFields({ email: normalizedEmail, phone: normalizedPhone, password });
    if (validation.message) return res.status(400).json(validation);

    const existingCustomer = await Customer.findOne({ email: normalizedEmail });
    // A generic response prevents attackers from discovering registered email addresses.
    if (existingCustomer) {
      return res.status(202).json({ message: "If this email is not already registered, your account will be created." });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const customer = await Customer.create({
      name: fullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      preferredSalonId: preferredSalonId || null,
      password_hash,
      role: "customer",
    });

    res.status(201).json({
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      token: generateToken(customer._id),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};


export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({
      $or: [
        { email },
        { username: email }
      ]
    });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // SuperAdmin requires 2FA via Email OTP
    if (admin.role === "super-admin") {
      const otpCode = generateOtpCode();
      admin.otpCodeHash = hashOtpCode(otpCode);
      admin.otpExpires = new Date(Date.now() + OTP_EXPIRATION_MS);
      admin.otpAttempts = 0;
      admin.otpLastSentAt = new Date();
      await admin.save();

      try {
        await sendSuperAdminOtpEmail({ email: admin.email, code: otpCode });
      } catch (emailError) {
        console.error("SuperAdmin OTP email delivery failed:", emailError.message);
        if (process.env.NODE_ENV !== "test") {
          return res.status(500).json({
            message: `Failed to send verification code: ${emailError.message || "Please check email configuration."}`
          });
        }
      }

      return res.status(200).json({
        requires2FA: true,
        tempToken: generatePending2FaToken(admin),
        emailMasked: maskEmail(admin.email),
        message: "Authentication code sent to your email address",
      });
    }

    res.json({
      id: admin._id,
      name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      image: admin.image,
      role: admin.role,
      salon_id: admin.salon_id,
      token: generateToken(admin)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifySuperAdminOtp = async (req, res) => {
  try {
    const { tempToken, otpCode } = req.body;
    if (!tempToken || !otpCode) {
      return res.status(400).json({ message: "Verification token and 6-digit code are required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Verification session expired or invalid. Please sign in again." });
    }

    if (decoded.purpose !== "superadmin-2fa") {
      return res.status(403).json({ message: "Invalid verification purpose" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || admin.role !== "super-admin") {
      return res.status(404).json({ message: "SuperAdmin account not found" });
    }

    if (!admin.otpExpires || admin.otpExpires <= new Date()) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    if ((admin.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: "Too many incorrect attempts. Please sign in again to request a new code." });
    }

    const providedHash = hashOtpCode(otpCode);
    if (admin.otpCodeHash !== providedHash) {
      admin.otpAttempts = (admin.otpAttempts || 0) + 1;
      await admin.save();
      const remaining = MAX_OTP_ATTEMPTS - admin.otpAttempts;
      return res.status(400).json({
        message: remaining > 0
          ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please sign in again to request a new code."
      });
    }

    // OTP is valid! Clear OTP fields and enroll MFA
    admin.otpCodeHash = null;
    admin.otpExpires = null;
    admin.otpAttempts = 0;
    admin.otpLastSentAt = null;
    admin.mfaEnrolled = true;
    await admin.save();

    // If initial password must be changed (e.g. client handover), enforce change password
    if (admin.mustChangePassword === true) {
      return res.status(200).json({
        requiresPasswordChange: true,
        message: "Code verified. Please set your new password before proceeding.",
        token: generateHardeningToken(admin, "change-password"),
      });
    }

    return res.status(200).json({
      id: admin._id,
      name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      image: admin.image,
      role: admin.role,
      salon_id: admin.salon_id,
      token: generateToken(admin)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to verify authentication code" });
  }
};

export const resendSuperAdminOtp = async (req, res) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Verification session expired. Please sign in again." });
    }

    if (decoded.purpose !== "superadmin-2fa") {
      return res.status(403).json({ message: "Invalid verification purpose" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || admin.role !== "super-admin") {
      return res.status(404).json({ message: "SuperAdmin account not found" });
    }

    // Rate limiting: 60s cooldown
    const now = Date.now();
    if (admin.otpLastSentAt && (now - new Date(admin.otpLastSentAt).getTime() < OTP_RESEND_COOLDOWN_MS)) {
      const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - new Date(admin.otpLastSentAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds}s before requesting another code.` });
    }

    const newCode = generateOtpCode();
    admin.otpCodeHash = hashOtpCode(newCode);
    admin.otpExpires = new Date(now + OTP_EXPIRATION_MS);
    admin.otpAttempts = 0;
    admin.otpLastSentAt = new Date(now);
    await admin.save();

    try {
      await sendSuperAdminOtpEmail({ email: admin.email, code: newCode });
    } catch (emailError) {
      console.error("SuperAdmin OTP resend email failed:", emailError.message);
      if (process.env.NODE_ENV !== "test") {
        return res.status(500).json({
          message: `Failed to send verification code: ${emailError.message || "Please check email configuration."}`
        });
      }
    }

    return res.status(200).json({
      message: "A new authentication code has been sent to your email.",
      emailMasked: maskEmail(admin.email),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to resend code" });
  }
};

export const changePassword = async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: "Password is required" });
  const validation = validateProfileFields({ password });
  if (validation.message) return res.status(400).json(validation);
  const admin = await Admin.findById(req.user.id);
  if (!admin) return res.status(404).json({ message: "User not found" });
  admin.password = await bcrypt.hash(password, 12);
  admin.mustChangePassword = false;
  admin.mfaEnrolled = true;
  await admin.save();
  res.json({
    message: "Password changed successfully",
    token: generateToken(admin),
    id: admin._id,
    name: admin.full_name,
    email: admin.email,
    phone: admin.phone,
    image: admin.image,
    role: admin.role,
    salon_id: admin.salon_id,
  });
};

export const setupMfa = async (req, res) => {
  const admin = await Admin.findById(req.user.id);
  if (!admin) return res.status(404).json({ message: "User not found" });
  admin.mfaEnrolled = true;
  await admin.save();
  res.json({ message: "MFA setup completed", token: generateToken(admin) });
};

const findAccountByEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = await Admin.findOne({ email: normalizedEmail });
  if (admin) return { user: admin, passwordField: "password" };

  const staff = await Staff.findOne({ email: normalizedEmail });
  if (staff) return { user: staff, passwordField: "password_hash" };

  const customer = await Customer.findOne({ email: normalizedEmail });
  if (customer) return { user: customer, passwordField: "password_hash" };

  return null;
};

const findAccountByResetHash = async (tokenHash) => {
  const models = [Admin, Staff, Customer];
  for (const Model of models) {
    const user = await Model.findOne({ resetPasswordTokenHash: tokenHash });
    if (user) return { user, passwordField: Model === Admin ? "password" : "password_hash" };
  }
  return null;
};

export const forgotPassword = async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  try {
    const account = await findAccountByEmail(normalizedEmail);
    if (account) {
      const { rawToken, tokenHash, expiresAt } = createPasswordResetToken();
      account.user.resetPasswordTokenHash = tokenHash;
      account.user.resetPasswordExpires = expiresAt;
      await account.user.save();

      try {
        await sendPasswordResetEmail({ email: normalizedEmail, rawToken });
      } catch (emailError) {
        console.error("Password reset email delivery failed", { email: normalizedEmail, error: emailError.message });
      }
    }

    return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    console.error("Password reset request failed", { error: error.message });
    return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  const validation = validateProfileFields({ password: newPassword });
  if (validation.message) return res.status(400).json(validation);

  try {
    const account = await findAccountByResetHash(hashPasswordResetToken(token));
    if (!account || !account.user.resetPasswordExpires || account.user.resetPasswordExpires <= new Date()) {
      if (account) {
        account.user.resetPasswordTokenHash = null;
        account.user.resetPasswordExpires = null;
        await account.user.save();
      }
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    account.user[account.passwordField] = await bcrypt.hash(newPassword, 12);
    account.user.resetPasswordTokenHash = null;
    account.user.resetPasswordExpires = null;
    if (account.passwordField === "password") account.user.mustChangePassword = false;
    await account.user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset failed", { error: error.message });
    return res.status(500).json({ message: "Unable to reset password. Please try again later." });
  }
};

export const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const isMatch = await bcrypt.compare(password, staff.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (staff.salon_id && staff.role !== "super-admin") {
      const salon = await Salon.findById(staff.salon_id).select("status");
      if (salon?.status === "deactivated") {
        return res.status(403).json({ message: "This salon has been deactivated. Staff login is unavailable." });
      }
    }

res.json({
      id: staff._id,
      name: staff.full_name,
      email: staff.email,
      phone: staff.phone,
      image: staff.image,
      role: staff.role,
      salon_id: staff.salon_id,
      token: generateToken(staff)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const promoteAdmin = async (req, res) => {
  try {
    if (req.user.role !== "super-admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.role = "manager";
    await admin.save();

    res.json({ message: "User promoted to manager", role: admin.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow editing your own profile
    if (req.user.id !== id) {
      return res.status(403).json({ message: "Not authorized to edit this profile" });
    }

    const { full_name, email, phone, username, password } = req.body;
    const validation = validateProfileFields({ email, phone, password, username });
    if (validation.message) return res.status(400).json(validation);

    const normalizedEmail = validation.normalizedEmail;
    const normalizedPhone = validation.normalizedPhone;

    if (normalizedEmail) {
      const emailQueries = [
        Customer.findOne({ email: normalizedEmail, _id: { $ne: id } }),
        Admin.findOne({ email: normalizedEmail, _id: { $ne: id } }),
        Staff.findOne({ email: normalizedEmail, _id: { $ne: id } })
      ];
      if ((await Promise.all(emailQueries)).some(Boolean)) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    // Profile picture upload (if provided)
    const image = req.file ? await storeMedia(req.file, "salonhub/profiles") : undefined;

    let user;
    if (req.user.role === "customer" || req.user.role === "user") {
      user = await Customer.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.name = full_name || user.name;
      user.email = normalizedEmail || user.email;
      user.phone = normalizedPhone || user.phone;
      if (image !== undefined) user.image = image;

      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(password, salt);
      }

      await user.save();

      return res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        role: user.role,
        token: generateToken(user)
      });
    }

    user = await Admin.findById(id);
    if (!user) {
      // maybe it's staff?
      user = await Staff.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      user.full_name = full_name || user.full_name;
      user.email = normalizedEmail || user.email;
      user.phone = normalizedPhone || user.phone;
      if (image !== undefined) user.image = image;

      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(password, salt);
      }

      await user.save();

      return res.json({
        id: user._id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        role: user.role,
        salon_id: user.salon_id,
        token: generateToken(user)
      });
    }

    user.full_name = full_name || user.full_name;
    user.email = normalizedEmail || user.email;
    user.phone = normalizedPhone || user.phone;
    user.username = username || user.username;
    if (image !== undefined) user.image = image;

    // Handle password update securely
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      id: user._id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      username: user.username,
      role: user.role,
      salon_id: user.salon_id,
      token: generateToken(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
