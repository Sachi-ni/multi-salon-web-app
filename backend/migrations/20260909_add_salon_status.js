import "dotenv/config";
import mongoose from "mongoose";
import Salon from "../models/Salon.js";

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const result = await Salon.updateMany(
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

  console.log(`Updated ${result.modifiedCount} salon document(s).`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Salon status migration failed:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
