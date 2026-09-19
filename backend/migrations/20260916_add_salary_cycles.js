import "dotenv/config";
import mongoose from "mongoose";

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");

  await mongoose.connect(process.env.MONGO_URI);
  const collection = mongoose.connection.collection("salaries");
  const indexes = await collection.indexes();
  const legacyIndex = indexes.find(
    (index) => index.name === "salon_id_1_staff_id_1_period_1_frequency_1"
  );

  if (legacyIndex) await collection.dropIndex(legacyIndex.name);

  await collection.createIndex(
    {
      salon_id: 1,
      staff_id: 1,
      period: 1,
      frequency: 1,
      cycleId: 1,
    },
    {
      name: "salary_cycle_unique",
      unique: true,
      partialFilterExpression: { cycleId: { $type: "string" } },
    }
  );

  console.log("Salary cycle index migration completed.");
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Salary cycle migration failed:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
