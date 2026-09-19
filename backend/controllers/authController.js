import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";
import Customer from "../models/Customer.js";
import Salon from "../models/Salon.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateToken, {
  generateHardeningToken,
  generatePending2FaToken,
  generatePasswordResetSessionToken,
  hashPasswordResetSessionToken,
} from "../utils/generateToken.js";
import { storeMedia } from "../utils/mediaStorage.js";
import { assertNotPrivilegedRole } from "../utils/roleGuard.js";
import {
  generateOtpCode,
  hashOtpCode,
  maskEmail,
  sendOtpEmail,
  sendSuperAdminOtpEmail,
  OTP_EXPIRATION_MS,
  OTP_RESEND_COOLDOWN_MS,
  MAX_OTP_ATTEMPTS,
} from "../utils/emailOtp.js";
import { validateNewPassword } from "../utils/passwordPolicy.js";


const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{3,63}$/;
const PHONE_PATTERN = /^\+?[0-9]{10}$/;
const GENERIC_RESET_MESSAGE = "If this email is registered, an OTP has been sent.";
const GENERIC_OTP_ERROR = "Invalid or expired code";
const RESET_RESPONSE_DELAY_MS = 300;

const waitForResetResponse = () => new Promise((resolve) => setTimeout(resolve, RESET_RESPONSE_DELAY_MS));

const validateProfileFields = ({ email, phone, password, username }) => {
  const enteredEmail = email?.trim();
  const normalizedEmail = enteredEmail?.toLowerCase();
  const normalizedPhone = phone?.replace(/[\s()-]/g, "");

  if (enteredEmail && enteredEmail !== normalizedEmail) {
    return { message: "Email address must use lowercase letters only" };
  }
  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    return { message: "Please enter a valid email address" };
  }
  if (normalizedPhone && !PHONE_PATTERN.test(normalizedPhone)) {
    return { message: "Phone number must contain exactly 10 digits and may start with +" };
  }
  if (password) {
    const passwordError = validateNewPassword(password);
    if (passwordError) return { message: passwordError };
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
    const normalizedPhone = phone?.replace(/[\s()-]/g, "");

    // This public route can only create customers; privileged roles must never be self-registered.
    if (role && role.toLowerCase() !== "customer") {
      return res.status(400).json({ message: "Only customer registration is allowed" });
    }
    assertNotPrivilegedRole(role);

    const validation = validateProfileFields({ email, phone: normalizedPhone, password });
    if (validation.message) return res.status(400).json(validation);

    const existingCustomer = await Customer.findOne({ email: validation.normalizedEmail });
    // A generic response prevents attackers from discovering registered email addresses.
    if (existingCustomer) {
      return res.status(202).json({ message: "If this email is not already registered, your account will be created." });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const customer = await Customer.create({
      name: fullName,
      email: validation.normalizedEmail,
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

      let otpResult = { delivered: true };
      try {
        otpResult = await sendSuperAdminOtpEmail({ email: admin.email, code: otpCode });
      } catch (emailError) {
        console.error("SuperAdmin OTP email delivery failed:", emailError.message);
      }

      return res.status(200).json({
        requires2FA: true,
        tempToken: generatePending2FaToken(admin),
        emailMasked: maskEmail(admin.email),
        message: otpResult?.delivered
          ? "Authentication code sent to your email address"
          : "Authentication code generated. Please check your email or server logs.",
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

    let resendResult = { delivered: true };
    try {
      resendResult = await sendSuperAdminOtpEmail({ email: admin.email, code: newCode });
    } catch (emailError) {
      console.error("SuperAdmin OTP resend email failed:", emailError.message);
    }

    return res.status(200).json({
      message: resendResult?.delivered
        ? "A new authentication code has been sent to your email."
        : "A new authentication code has been generated. Please check your email or server logs.",
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

  const account = await findAccountById(req.user.id);
  if (!account || !["password", "password_hash"].includes(account.passwordField)) {
    return res.status(404).json({ message: "User not found" });
  }
  if (await bcrypt.compare(password, account.user[account.passwordField])) {
    return res.status(400).json({ message: "New password must be different from your temporary password" });
  }

  account.user[account.passwordField] = await bcrypt.hash(password, 12);
  account.user.mustChangePassword = false;
  if (account.passwordField === "password") account.user.mfaEnrolled = true;
  await account.user.save();
  res.json({
    message: "Password changed successfully",
    token: generateToken(account.user),
    id: account.user._id,
    name: account.user.full_name,
    email: account.user.email,
    phone: account.user.phone,
    image: account.user.image,
    role: account.user.role,
    salon_id: account.user.salon_id,
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
  const [admin, staff, customer] = await Promise.all([
    Admin.findOne({ email: normalizedEmail }),
    Staff.findOne({ email: normalizedEmail }),
    Customer.findOne({ email: normalizedEmail }),
  ]);
  if (admin) return { user: admin, Model: Admin, passwordField: "password" };
  if (staff) return { user: staff, Model: Staff, passwordField: "password_hash" };
  if (customer) return { user: customer, Model: Customer, passwordField: "password_hash" };

  return null;
};

const findAccountById = async (id) => {
  const [admin, staff, customer] = await Promise.all([
    Admin.findById(id),
    Staff.findById(id),
    Customer.findById(id),
  ]);
  if (admin) return { user: admin, Model: Admin, passwordField: "password" };
  if (staff) return { user: staff, Model: Staff, passwordField: "password_hash" };
  if (customer) return { user: customer, Model: Customer, passwordField: "password_hash" };

  return null;
};

export const forgotPassword = async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();

  try {
    const account = normalizedEmail && EMAIL_PATTERN.test(normalizedEmail)
      ? await findAccountByEmail(normalizedEmail)
      : null;
    if (account) {
      const now = Date.now();
      const lastSentAt = account.user.passwordResetOtpLastSentAt
        ? new Date(account.user.passwordResetOtpLastSentAt).getTime()
        : 0;
      if (!lastSentAt || now - lastSentAt >= OTP_RESEND_COOLDOWN_MS) {
        const otpCode = generateOtpCode();
        account.user.passwordResetOtpCodeHash = hashOtpCode(otpCode);
        account.user.passwordResetOtpExpires = new Date(now + OTP_EXPIRATION_MS);
        account.user.passwordResetOtpAttempts = 0;
        account.user.passwordResetOtpLastSentAt = new Date(now);
        account.user.passwordResetSessionHash = null;
        await account.user.save();

        // Do not await delivery: both account paths retain comparable response timing.
        void sendOtpEmail({ email: normalizedEmail, code: otpCode, type: "password-reset" })
          .catch((emailError) => console.error("Password reset OTP delivery failed", { error: emailError.message }));
      }
    }
  } catch (error) {
    console.error("Password reset request failed", { error: error.message });
  }
  await waitForResetResponse();
  return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
};

export const verifyPasswordResetOtp = async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const otpCode = String(req.body.otpCode || "").trim();

  try {
    const account = normalizedEmail && EMAIL_PATTERN.test(normalizedEmail)
      ? await findAccountByEmail(normalizedEmail)
      : null;
    const user = account?.user;
    const now = new Date();
    if (!user || !user.passwordResetOtpExpires || user.passwordResetOtpExpires <= now
      || !user.passwordResetOtpCodeHash || (user.passwordResetOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      return res.status(400).json({ message: GENERIC_OTP_ERROR });
    }

    const providedHash = hashOtpCode(otpCode);
    const activeOtpFilter = {
      _id: user._id,
      passwordResetOtpCodeHash: user.passwordResetOtpCodeHash,
      passwordResetOtpExpires: { $gt: now },
      passwordResetOtpAttempts: { $lt: MAX_OTP_ATTEMPTS },
    };

    if (providedHash !== user.passwordResetOtpCodeHash) {
      // Atomic increment prevents parallel requests from overwriting each
      // other's count and bypassing the five-attempt lockout.
      await account.Model.findOneAndUpdate(activeOtpFilter, {
        $inc: { passwordResetOtpAttempts: 1 },
      });
      return res.status(400).json({ message: GENERIC_OTP_ERROR });
    }

    const resetSessionToken = generatePasswordResetSessionToken(user);
    // Consume the OTP atomically, conditioned on the same lockout state.
    const consumedOtp = await account.Model.findOneAndUpdate(activeOtpFilter, {
      $set: {
        passwordResetOtpCodeHash: null,
        passwordResetOtpExpires: null,
        passwordResetOtpAttempts: 0,
        passwordResetOtpLastSentAt: null,
        passwordResetSessionHash: hashPasswordResetSessionToken(resetSessionToken),
      },
    }, { returnDocument: "after" });
    if (!consumedOtp) return res.status(400).json({ message: GENERIC_OTP_ERROR });
    return res.status(200).json({ resetSessionToken });
  } catch (error) {
    console.error("Password reset OTP verification failed", { error: error.message });
    return res.status(400).json({ message: GENERIC_OTP_ERROR });
  }
};

export const resetPassword = async (req, res) => {
  const { resetSessionToken, newPassword } = req.body;
  if (!resetSessionToken) return res.status(400).json({ message: GENERIC_OTP_ERROR });

  const validation = validateProfileFields({ password: newPassword });
  if (validation.message) return res.status(400).json(validation);

  try {
    const decoded = jwt.verify(resetSessionToken, process.env.JWT_SECRET);
    if (decoded.purpose !== "password_reset") throw new Error("Invalid reset session");
    const account = await findAccountById(decoded.id);
    if (!account || account.user.passwordResetSessionHash !== hashPasswordResetSessionToken(resetSessionToken)) {
      return res.status(400).json({ message: GENERIC_OTP_ERROR });
    }

    account.user[account.passwordField] = await bcrypt.hash(newPassword, 12);
    account.user.passwordResetSessionHash = null;
    // Completing an email-verified reset also replaces the temporary
    // password for any account type, so it must not lead to a second forced
    // change at the next login.
    if (account.user.mustChangePassword === true) account.user.mustChangePassword = false;
    await account.user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset failed", { error: error.message });
    return res.status(400).json({ message: GENERIC_OTP_ERROR });
  }
};

export const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = String(email || "").trim();
    const cleanIdentifierPhone = identifier.replace(/[\s()-]/g, "");

    // Search staff by email, full_name, OR phone number
    const staff = await Staff.findOne({
      $or: [
        { email: { $regex: `^${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        { full_name: { $regex: `^${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        ...(cleanIdentifierPhone ? [{ phone: { $regex: `${cleanIdentifierPhone}$` } }] : [])
      ]
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Phone may identify the account, but it is never a password substitute.
    const isPasswordMatch = await bcrypt.compare(password, staff.password_hash);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (staff.salon_id && staff.role !== "super-admin") {
      const salon = await Salon.findById(staff.salon_id).select("status");
      if (salon?.status === "deactivated") {
        return res.status(403).json({ message: "This salon has been deactivated. Staff login is unavailable." });
      }
    }

    if (staff.mustChangePassword === true) {
      return res.status(200).json({
        requiresHardening: true,
        hardeningStep: "change-password",
        message: "Please set a new password before proceeding.",
        token: generateHardeningToken(staff, "change-password"),
      });
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
