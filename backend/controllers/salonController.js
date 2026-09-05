import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import Feedback from "../models/Feedback.js";
import { storeMedia, isRemoteMedia } from "../utils/mediaStorage.js";

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const COMMON_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
]);
const SRI_LANKAN_PHONE_PATTERN = /^(?:\+94|0)\d{9}$/;
const COMMON_PASSWORDS = new Set([
  "123456",
  "12345678",
  "password",
  "password123",
  "qwerty",
]);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizePhone = (phone) => phone?.trim().replace(/[\s()\-]/g, "");

const validateManagerContact = ({ email, phone, password }) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = normalizePhone(phone);

  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    return { message: "Enter a valid manager email address." };
  }

  const emailDomain = normalizedEmail?.split("@")[1];
  if (normalizedEmail && !COMMON_EMAIL_DOMAINS.has(emailDomain)) {
    return {
      message: "Manager email must use Gmail, Yahoo, Outlook, or Hotmail (for example, manager@gmail.com).",
    };
  }

  if (normalizedPhone && !SRI_LANKAN_PHONE_PATTERN.test(normalizedPhone)) {
    return {
      message: "Enter a valid Sri Lankan phone number (for example, 0771234567 or +94771234567).",
    };
  }

  if (password) {
    const isComplex =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*]/.test(password);

    if (!isComplex || COMMON_PASSWORDS.has(password.toLowerCase())) {
      return {
        message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      };
    }
  }

  return { normalizedEmail, normalizedPhone };
};

const getManagerNameParts = (fullName, manager = {}) => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || manager.first_name || "Manager";
  const lastName = parts.join(" ") || manager.last_name || "Manager";

  return { firstName, lastName };
};

/**
 * Compute average rating and count from feedback for a given salon.
 * Combines serviceRating and staffRating from all feedback records.
 * Returns rating (0 if no feedback) and ratingCount.
 */
const getSalonRating = async (salonId) => {
  const feedbacks = await Feedback.find({ salon_id: salonId })
    .select("serviceRating staffRating")
    .lean();

  if (!feedbacks.length) {
    return { rating: 0, ratingCount: 0 };
  }

  const total = feedbacks.reduce(
    (sum, f) =>
      sum +
      (Number(f.serviceRating) || 0) +
      (Number(f.staffRating) || 0),
    0
  );

  const count = feedbacks.length;

  return {
    rating: Math.round((total / (count * 2)) * 10) / 10,
    ratingCount: count,
  };
};

export const createSalon = async (req, res) => {
  try {
    const {
      name,
      phone,
      location,
      about,
      managerName,
      managerEmail,
      managerPhone,
      managerPassword,
      open_time,
      close_time,
    } = req.body;

    if (!managerName || !managerEmail || !managerPassword) {
      return res.status(400).json({
        message: "Manager name, email and password are required.",
      });
    }

    if (open_time && close_time && open_time >= close_time) {
      return res.status(400).json({
        message: "Opening time must be earlier than closing time.",
      });
    }

    const validation = validateManagerContact({
      email: managerEmail,
      phone: managerPhone,
      password: managerPassword,
    });

    if (validation.message) {
      return res.status(400).json({ message: validation.message });
    }

    console.log("createSalon requested", {
      salonName: name,
      managerEmail: validation.normalizedEmail,
    });

    const existingManager = await Staff.findOne({
      email: {
        $regex: `^${escapeRegex(validation.normalizedEmail)}$`,
        $options: "i",
      },
    }).select("_id");

    if (existingManager) {
      return res.status(409).json({
        message: "That manager email is already in use.",
      });
    }

    const normalizedSalonPhone = normalizePhone(phone);
    if (normalizedSalonPhone && !SRI_LANKAN_PHONE_PATTERN.test(normalizedSalonPhone)) {
      return res.status(400).json({
        message: "Enter a valid salon phone number (for example, 0771234567 or +94771234567).",
      });
    }

    const { firstName, lastName } = getManagerNameParts(managerName);

    const salon = await Salon.create({
      name,
      location,
      phone: normalizedSalonPhone,
      about,
      open_time,
      close_time,
      logo: req.file ? await storeMedia(req.file, "salonhub/logos") : "",
    });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(managerPassword, salt);

    const manager = await Staff.create({
      full_name: managerName,
      first_name: firstName,
      last_name: lastName,
      email: validation.normalizedEmail,
      phone: validation.normalizedPhone,
      password_hash,
      role: "manager",
      status: "Active",
      salon_id: salon._id,
    });

    salon.staffCount = 1;
    await salon.save();

    console.log("createSalon completed", {
      salonId: salon._id,
      salonName: salon.name,
      managerEmail: manager.email,
    });

    res.status(201).json({
      message: "Salon and manager created successfully.",
      salon: {
        id: salon._id,
        name: salon.name,
      },
      manager: {
        id: manager._id,
        name: manager.full_name,
      },
    });
  } catch (error) {
    console.error("createSalon error", {
      errorName: error.name,
      errorCode: error.code,
      operation: "createSalon",
    });

    if (error.code === 11000) {
      return res.status(409).json({
        message: "That manager email is already in use.",
      });
    }

    if (process.env.NODE_ENV !== "production") {
      res.status(500).json({
        message: "Unable to create salon.",
      });
    } else {
      res.status(500).json({
        message: "Server error",
      });
    }
  }
};

export const getSalons = async (req, res) => {
  try {
    const salons = await Salon.find();

    const salonsWithManagers = await Promise.all(
      salons.map(async (s) => {
        // Get manager details
        const manager = await Staff.findOne({
          salon_id: s._id,
          role: "manager",
        }).select("full_name email phone");

        // Get actual staff count
        const actualStaffCount = await Staff.countDocuments({
          salon_id: s._id,
        });

        // Get rating
        const { rating, ratingCount } = await getSalonRating(
          s._id
        );

        const obj = s.toObject();

        // Manager information
        obj.managerName = manager?.full_name || "";
        obj.managerEmail = manager?.email || "";
        obj.managerPhone = manager?.phone || "";

        // Other information
        obj.staffCount = actualStaffCount;
        obj.rating = rating;
        obj.ratingCount = ratingCount;

        return obj;
      })
    );

    res.json(salonsWithManagers);
  } catch (error) {
    console.error("getSalons error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getSalonById = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({
        message: "Salon not found",
      });
    }

    // Count actual staff members for this salon
    const actualStaffCount = await Staff.countDocuments({
      salon_id: salon._id,
    });

    // Get manager information
    const manager = await Staff.findOne({
      salon_id: salon._id,
      role: "manager",
    }).select("full_name email phone");

    const salonObj = salon.toObject();

    salonObj.staffCount = actualStaffCount;

    // Add manager details to response
    if (manager) {
      salonObj.managerName = manager.full_name || "";
      salonObj.managerEmail = manager.email || "";
      salonObj.managerPhone = manager.phone || "";
    } else {
      salonObj.managerName = "";
      salonObj.managerEmail = "";
      salonObj.managerPhone = "";
    }

    // Compute average rating from feedback
    const { rating, ratingCount } = await getSalonRating(
      salon._id
    );

    salonObj.rating = rating;
    salonObj.ratingCount = ratingCount;

    console.log("Salon Edit Response:", salonObj);

    res.json(salonObj);
  } catch (error) {
    console.error("getSalonById error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateSalon = async (req, res) => {
  try {
    // Whitelist salon metadata so this endpoint cannot alter account ownership or credentials.
    const allowedFields = ["name", "address", "location", "phone", "email", "status", "timezone"];
    const salonData = Object.fromEntries(
      allowedFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]])
    );

    if (salonData.phone !== undefined) {
      salonData.phone = normalizePhone(salonData.phone);
      if (!SRI_LANKAN_PHONE_PATTERN.test(salonData.phone)) {
        return res.status(400).json({
          message: "Enter a valid Sri Lankan phone number (for example, 0771234567 or +94771234567).",
        });
      }
    }

    if (req.file) {
      salonData.logo = await storeMedia(req.file, "salonhub/logos");
    }

    const salon = await Salon.findByIdAndUpdate(
      req.params.id,
      salonData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!salon) {
      return res.status(404).json({
        message: "Salon not found",
      });
    }

    res.json({
      salon,
    });
  } catch (error) {
    console.error("updateSalon error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteSalon = async (req, res) => {
  try {
    const salon = await Salon.findByIdAndDelete(req.params.id);

    if (!salon) {
      return res.status(404).json({
        message: "Salon not found",
      });
    }

    res.json({
      message: "Salon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Upload multiple gallery photos for a salon (super-admin / manager)
 * Expects req.files (multer array field name "images")
 */
export const uploadSalonImages = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({
        message: "Salon not found",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No images uploaded",
      });
    }

    const newPaths = await Promise.all(
      req.files.map((file) => storeMedia(file, "salonhub/gallery"))
    );

    salon.images = [
      ...(salon.images || []),
      ...newPaths,
    ];

    await salon.save();

    res.status(201).json({
      images: salon.images,
      message: "Images uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Remove a single gallery photo from a salon
 * Expects req.params.filename
 */
export const removeSalonImage = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({
        message: "Salon not found",
      });
    }

    const filename = path.posix.basename(String(req.params.filename || "").replace(/\\/g, "/"));

    const removedImage = (salon.images || []).find((img) => img.split("/").pop() === filename);
    const remaining = (salon.images || []).filter((img) => img.split("/").pop() !== filename);

    salon.images = remaining;

    await salon.save();

    // Remote media is managed by its shared storage provider. Only legacy local
    // uploads have a file on this server to remove.
    if (isRemoteMedia(removedImage)) {
      return res.json({ images: salon.images, message: "Image removed successfully" });
    }

    // Best-effort physical file deletion for legacy local uploads
    try {
      const filePath = path.join(
        __dirname,
        "../uploads",
        filename
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      console.warn(
        "Could not delete image file:",
        fileErr.message
      );
    }

    res.json({
      images: salon.images,
      message: "Image removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};