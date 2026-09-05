import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";
import Customer from "../models/Customer.js";
import bcrypt from "bcryptjs";
import generateToken, { generateHardeningToken } from "../utils/generateToken.js";
import { storeMedia } from "../utils/mediaStorage.js";
import { assertNotPrivilegedRole } from "../utils/roleGuard.js";


const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{3,63}$/;
const PHONE_PATTERN = /^\+?[0-9]{10}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[\S]{8,}$/;
const COMMON_PASSWORDS = new Set(["12345678", "password", "password123", "qwerty123", "letmein"]);

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
    return { message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character" };
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

    // Do not issue a full session until the seeded SuperAdmin changes the password and enrolls MFA.
    const requiresPasswordChange = admin.mustChangePassword === true;
    const requiresMfa = admin.mfaEnrolled === false;
    // Older SuperAdmin documents predate these fields; only explicit hardening flags block them.
    if (admin.role === "super-admin" && (requiresPasswordChange || requiresMfa)) {
      const purpose = requiresPasswordChange ? "change-password" : "mfa-setup";
      return res.status(200).json({
        requiresHardening: true,
        hardeningStep: purpose,
        token: generateHardeningToken(admin, purpose),
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

export const changePassword = async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: "Password is required" });
  const validation = validateProfileFields({ password });
  if (validation.message) return res.status(400).json(validation);
  const admin = await Admin.findById(req.user.id);
  if (!admin) return res.status(404).json({ message: "User not found" });
  admin.password = await bcrypt.hash(password, 12);
  admin.mustChangePassword = false;
  await admin.save();
  res.json({ message: "Password changed; MFA setup is required", token: generateHardeningToken(admin, "mfa-setup") });
};

export const setupMfa = async (req, res) => {
  const admin = await Admin.findById(req.user.id);
  if (!admin) return res.status(404).json({ message: "User not found" });
  admin.mfaEnrolled = true;
  await admin.save();
  res.json({ message: "MFA setup completed", token: generateToken(admin) });
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
