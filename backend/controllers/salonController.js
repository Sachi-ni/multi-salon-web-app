import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import Feedback from "../models/Feedback.js";

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log("createSalon called with body:", req.body);

    const {
      name,
      phone,
      location,
      about,
      managerName,
      managerEmail,
      managerPhone,
      managerPassword,
    } = req.body;

    if (!managerName || !managerEmail || !managerPassword) {
      return res.status(400).json({
        message: "Manager name, email and password are required.",
      });
    }

    const salon = await Salon.create({
      name,
      location,
      phone,
      about,
      logo: req.file ? req.file.path : "",
    });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(managerPassword, salt);

    const manager = await Staff.create({
      full_name: managerName,
      email: managerEmail,
      phone: managerPhone,
      password_hash,
      role: "manager",
      status: "Active",
      salon_id: salon._id,
    });

    salon.staffCount = 1;
    await salon.save();

    res.status(201).json({ salon, manager });
  } catch (error) {
    console.error("createSalon error:", error);

    if (process.env.NODE_ENV !== "production") {
      res.status(500).json({
        message: error.message,
        stack: error.stack,
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
        const manager = await Staff.findOne({
          salon_id: s._id,
          role: "manager",
        }).select("full_name");

        const actualStaffCount = await Staff.countDocuments({
          salon_id: s._id,
        });

        const { rating, ratingCount } = await getSalonRating(s._id);

        const obj = s.toObject();

        obj.managerName = manager ? manager.full_name : null;
        obj.staffCount = actualStaffCount;
        obj.rating = rating;
        obj.ratingCount = ratingCount;

        return obj;
      })
    );

    res.json(salonsWithManagers);
  } catch (error) {
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

    // Get manager info
    const manager = await Staff.findOne({
      salon_id: salon._id,
      role: "manager",
    });

    const salonObj = salon.toObject();

    salonObj.staffCount = actualStaffCount;

    if (manager) {
      salonObj.managerEmail = manager.email;
    }

    // Compute average rating from feedback
    const { rating, ratingCount } = await getSalonRating(salon._id);

    salonObj.rating = rating;
    salonObj.ratingCount = ratingCount;

    console.log("Salon Edit Response:", salonObj);

    res.json(salonObj);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateSalon = async (req, res) => {
  try {
    const {
      managerEmail,
      managerPassword,
      ...salonData
    } = req.body;

    // If a new logo file was uploaded, set it
    if (req.file) {
      salonData.logo = req.file.path;
    }

    const salon = await Salon.findByIdAndUpdate(
      req.params.id,
      salonData,
      {
        new: true,
      }
    );

    if (!salon) {
      return res.status(404).json({
        message: "Salon not found",
      });
    }

    // Update or create manager if email or password is provided
    if (managerEmail || managerPassword) {
      const manager = await Staff.findOne({
        salon_id: salon._id,
        role: "manager",
      });

      if (manager) {
        if (managerEmail) {
          manager.email = managerEmail;
        }

        if (managerPassword) {
          const salt = await bcrypt.genSalt(10);
          manager.password_hash = await bcrypt.hash(
            managerPassword,
            salt
          );
        }

        await manager.save();
      } else if (managerEmail && managerPassword) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(
          managerPassword,
          salt
        );

        await Staff.create({
          full_name: salon.name + " Manager",
          email: managerEmail,
          phone: salon.phone || "",
          password_hash,
          role: "manager",
          status: "Active",
          salon_id: salon._id,
        });
      }
    }

    res.json(salon);
  } catch (error) {
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

    const newPaths = req.files.map((f) =>
      f.path.replace(/\\/g, "/")
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

    const filename = req.params.filename.replace(/\\/g, "/");

    const remaining = (salon.images || []).filter((img) => {
      const imgFile = img.split("/").pop();
      return imgFile !== filename;
    });

    salon.images = remaining;

    await salon.save();

    // Best-effort physical file deletion
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