import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const test = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();
  const appointments = await db.collection("appointments").find({}).toArray();
  
  for (const appt of appointments) {
    if (appt.salon_id === "all") {
      console.log("FOUND CORRUPT APPOINTMENT:", appt._id);
    }
  }
  console.log("Done checking", appointments.length, "appointments");
  await client.close();
};

test();
