import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";
import Customer from "../models/Customer.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const registerAdmin = async (req, res) => {
  try {
    const { full_name, username, email, phone, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Decide role securely
    let role = "user"; // default
    const superAdminExists = await Admin.findOne({ role: "super-admin" });
    if (!superAdminExists) {
      role = "super-admin"; // bootstrap first account
    }

    const admin = new Admin({
      full_name,
      username,
      email,
      phone,
      password: password_hash,
      role
    });

    await admin.save();

res.status(201).json({
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

    admin.role = "staff-admin";
    await admin.save();

    res.json({ message: "User promoted to staff admin", role: admin.role });
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

    // Profile picture upload (if provided)
    const image = req.file ? req.file.path : undefined;

    let user;
    if (req.user.role === "customer" || req.user.role === "user") {
      user = await Customer.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.name = full_name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
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
        token: generateToken(user._id) // using user._id instead of whole object based on how customerRegister works
      });
    }

    user = await Admin.findById(id);
    if (!user) {
      // maybe it's staff?
      user = await Staff.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      user.full_name = full_name || user.full_name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
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
        token: generateToken(user._id)
      });
    }

    user.full_name = full_name || user.full_name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
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
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
