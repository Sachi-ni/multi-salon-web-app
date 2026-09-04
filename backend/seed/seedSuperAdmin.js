import "dotenv/config";
import crypto from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

export const seedSuperAdmin = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }
  if (!process.env.SUPERADMIN_EMAIL) {
    throw new Error("SUPERADMIN_EMAIL is required");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Admin.findOne({ role: "super-admin" }).select("_id");
  if (existing) {
    console.log("SuperAdmin already exists; no account was created.");
    return;
  }

  const generatedPassword = !process.env.SUPERADMIN_INITIAL_PASSWORD;
  const initialPassword = process.env.SUPERADMIN_INITIAL_PASSWORD || crypto.randomBytes(18).toString("base64url");
  const password = await bcrypt.hash(initialPassword, 12);
  const email = process.env.SUPERADMIN_EMAIL.trim().toLowerCase();
  const username = email.split("@")[0];

  await Admin.create({
    full_name: "Super Admin",
    username,
    email,
    password,
    role: "super-admin",
    salon_id: null,
    mustChangePassword: true,
    mfaEnrolled: false,
  });

  console.log(`Created SuperAdmin account for ${email}.`);
  if (generatedPassword) {
    console.log(`Generated initial password (printout will not be repeated): ${initialPassword}`);
  }
};

if (process.argv[1]?.endsWith("seedSuperAdmin.js")) {
  seedSuperAdmin()
  .catch((error) => {
    console.error("SuperAdmin seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
}
