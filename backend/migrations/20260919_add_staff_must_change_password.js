import dotenv from "dotenv";
import mongoose from "mongoose";
import Staff from "../models/Staff.js";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI);
  const missingFlag = { mustChangePassword: { $exists: false } };
  const unusablePasswordHash = {
    $or: [
      { password_hash: { $exists: false } },
      { password_hash: null },
      { password_hash: "" },
      { password_hash: { $not: /^\$2[aby]\$\d{2}\$.{53}$/ } },
    ],
  };
  const [total, missingFlagCount, unusablePasswordHashCount, phoneOnlyRiskCount] = await Promise.all([
    Staff.countDocuments(),
    Staff.countDocuments(missingFlag),
    Staff.countDocuments(unusablePasswordHash),
    Staff.countDocuments({ phone: { $type: "string", $ne: "" }, ...unusablePasswordHash }),
  ]);

  console.log(JSON.stringify({
    total,
    missingMustChangePassword: missingFlagCount,
    unusablePasswordHash: unusablePasswordHashCount,
    phoneOnlyRisk: phoneOnlyRiskCount,
  }));

  if (process.argv.includes("--report-only")) process.exitCode = 0;
  else {
    const result = await Staff.updateMany(missingFlag, { $set: { mustChangePassword: false } });
    console.log(`Marked ${result.modifiedCount} existing staff/manager account(s) as not requiring a password change.`);
  }
} finally {
  await mongoose.disconnect();
}
