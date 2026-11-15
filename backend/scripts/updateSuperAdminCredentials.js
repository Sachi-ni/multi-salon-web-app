import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function updateSuperAdmin() {
  const email = "pawanmadushanka015@gmail.com";
  const password = "jfn123#AA";

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to database successfully.");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const username = email.split("@")[0];

  const updateResult = await mongoose.connection.collection("admins").updateOne(
    { role: "super-admin" },
    {
      $set: {
        email: email,
        username: username,
        password: passwordHash,
        mustChangePassword: false,
        mfaEnrolled: false,
        otpCodeHash: null,
        otpExpires: null,
        otpAttempts: 0,
      },
    }
  );

  console.log("Matched documents:", updateResult.matchedCount);
  console.log("Modified documents:", updateResult.modifiedCount);

  const updatedAdmin = await mongoose.connection.collection("admins").findOne({ role: "super-admin" });
  console.log("Verified SuperAdmin Record in MongoDB Atlas:", {
    email: updatedAdmin.email,
    username: updatedAdmin.username,
    role: updatedAdmin.role,
  });

  // Also verify password matches
  const isMatch = await bcrypt.compare(password, updatedAdmin.password);
  console.log("Password hash verification matches:", isMatch);

  await mongoose.disconnect();
  console.log("Database disconnected successfully.");
}

updateSuperAdmin().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
