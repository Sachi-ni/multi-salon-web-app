import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

// Ensure .env is loaded from backend directory regardless of where script is called
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const EMAIL_REGEX = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,63}$/;

export const seedSuperAdmin = async () => {
  // 1. Validate environment variables
  if (!process.env.MONGO_URI) {
    throw new Error("Missing required environment variable: MONGO_URI in backend/.env");
  }

  if (!process.env.SUPERADMIN_EMAIL) {
    throw new Error("Missing required environment variable: SUPERADMIN_EMAIL in backend/.env");
  }

  if (!process.env.SUPERADMIN_INITIAL_PASSWORD) {
    throw new Error("Missing required environment variable: SUPERADMIN_INITIAL_PASSWORD in backend/.env");
  }

  const email = process.env.SUPERADMIN_EMAIL.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new Error(`Invalid SUPERADMIN_EMAIL format: "${email}". Please provide a valid email address.`);
  }

  const initialPassword = process.env.SUPERADMIN_INITIAL_PASSWORD;
  if (initialPassword.length < 6) {
    throw new Error("SUPERADMIN_INITIAL_PASSWORD must be at least 6 characters long.");
  }

  // 2. Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (connError) {
    throw new Error(`Database connection failed: ${connError.message}`);
  }

  // 3. Check if Super Admin already exists
  const existingSuperAdmin = await Admin.findOne({
    $or: [
      { role: "super-admin" },
      { email }
    ]
  });

  if (existingSuperAdmin) {
    const hardeningUpdates = {};
    if (existingSuperAdmin.mustChangePassword === undefined) {
      hardeningUpdates.mustChangePassword = true;
    }
    if (existingSuperAdmin.mfaEnrolled === undefined) {
      hardeningUpdates.mfaEnrolled = false;
    }
    if (Object.keys(hardeningUpdates).length > 0) {
      await Admin.updateOne({ _id: existingSuperAdmin._id }, { $set: hardeningUpdates });
      console.log("Existing Super Admin marked for account hardening");
    }
    console.log("Super Admin already exists");
    return;
  }

  // 4. Hash password and create Super Admin using existing Admin model
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(initialPassword, salt);
  const username = email.split("@")[0];

  await Admin.create({
    full_name: "Super Admin",
    username,
    email,
    phone: "",
    password: passwordHash,
    role: "super-admin",
    salon_id: null,
    mustChangePassword: true,
    mfaEnrolled: false
  });

  console.log("Super Admin created successfully");
};

// Execute if run directly
if (process.argv[1]?.endsWith("seedSuperAdmin.js")) {
  seedSuperAdmin()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error("Super Admin seeding error:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
      }
    });
}
