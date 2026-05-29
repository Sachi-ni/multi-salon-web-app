import mongoose from "mongoose";
import Service from "./models/Service.js";
import dotenv from "dotenv";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await Service.countDocuments();
    if (count === 0) {
      const services = [
        { service_name: "Haircut", base_price: 30, description: "Classic haircut and style", duration: 30 },
        { service_name: "Hair Color", base_price: 85, description: "Full head color service", duration: 90 },
        { service_name: "Hair Treatment", base_price: 60, description: "Deep conditioning treatment", duration: 45 },
        { service_name: "Blowout", base_price: 45, description: "Wash and professional blowout", duration: 40 },
        { service_name: "Highlights", base_price: 120, description: "Full head highlights", duration: 120 }
      ];
      await Service.insertMany(services);
      console.log("Services seeded successfully!");
    } else {
      console.log("Services already exist in database.");
    }
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    process.exit(0);
  }
};

seed();
