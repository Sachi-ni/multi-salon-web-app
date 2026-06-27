import mongoose from "mongoose";
import Salon from "./models/Salon.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://pawanmadushanka15:QpA06g1yTq4n1bH6@saloon.xbc9afc.mongodb.net/test?retryWrites=true&w=majority")
  .then(async () => {
    const salons = await Salon.find();
    console.log("Salons:");
    salons.forEach(s => {
      console.log(`- ${s.name}: open=${s.open_time}, close=${s.close_time}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
