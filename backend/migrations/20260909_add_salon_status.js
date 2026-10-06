import "dotenv/config";
import mongoose from "mongoose";
import Salon from "../models/Salon.js";

// Repairs salon documents so the public booking filters work for every salon:
//  - status missing / null / any casing of "active" (e.g. "Active")  → "active"
//  - isPaused missing                                                → false
// Salons explicitly set to "deactivated" are left untouched.
// Safe to run multiple times (idempotent).
const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);

  // 1. Salons created before the status field existed → default to active.
  const missingStatus = await Salon.updateMany(
    { status: { $exists: false } },
    {
      $set: {
        status: "active",
        deactivationType: null,
        deactivatedAt: null,
        deactivatedReason: null,
        deactivatedBy: null,
        isPaused: false,
      },
    }
  );

  // 2. Normalize casing (e.g. "Active" → "active") without touching "deactivated".
  const normalizedStatus = await Salon.updateMany(
    { status: { $exists: true } },
    [{ $set: { status: { $toLower: "$status" } } }],
    { updatePipeline: true }
  );

  // 3. Salons missing the isPaused flag → not paused.
  const missingPaused = await Salon.updateMany(
    { isPaused: { $exists: false } },
    { $set: { isPaused: false } }
  );

  console.log(
    `Salon repair done. status defaulted: ${missingStatus.modifiedCount}, ` +
      `status normalized: ${normalizedStatus.modifiedCount}, ` +
      `isPaused defaulted: ${missingPaused.modifiedCount}.`
  );
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Salon status migration failed:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
