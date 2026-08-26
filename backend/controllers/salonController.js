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
    const {
      managerName,
      managerPhone,
      managerEmail,
      managerPassword,
      ...salonData
    } = req.body;

    // If a new logo file was uploaded, update logo
    if (req.file) {
      salonData.logo = req.file.path.replace(/\\/g, "/");
    }

    // Update salon information
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

    // Find existing manager
    let manager = await Staff.findOne({
      salon_id: salon._id,
      role: "manager",
    });

    // Update existing manager
    if (manager) {
      if (managerName !== undefined) {
        manager.full_name = managerName;
      }

      if (managerPhone !== undefined) {
        manager.phone = managerPhone;
      }

      if (managerEmail !== undefined && managerEmail !== "") {
        manager.email = managerEmail;
      }

      if (
        managerPassword !== undefined &&
        managerPassword !== ""
      ) {
        const salt = await bcrypt.genSalt(10);

        manager.password_hash = await bcrypt.hash(
          managerPassword,
          salt
        );
      }

      await manager.save();
    }

    // Create manager if one does not exist
    else if (
      managerName ||
      managerPhone ||
      managerEmail ||
      managerPassword
    ) {
      if (!managerEmail || !managerPassword) {
        return res.status(400).json({
          message:
            "Manager email and password are required when creating a new manager.",
        });
      }

      const salt = await bcrypt.genSalt(10);

      const password_hash = await bcrypt.hash(
        managerPassword,
        salt
      );

      manager = await Staff.create({
        full_name:
          managerName || `${salon.name} Manager`,
        email: managerEmail,
        phone: managerPhone || "",
        password_hash,
        role: "manager",
        status: "Active",
        salon_id: salon._id,
      });
    }

    res.json({
      salon,
      manager: manager
        ? {
            id: manager._id,
            name: manager.full_name,
            phone: manager.phone,
            email: manager.email,
          }
        : null,
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