import request from "supertest";
import app from "./testApp.js";
import Bill from "../models/Bill.js";
import Appointment from "../models/Appointment.js";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import generateToken from "../utils/generateToken.js";

test("billing uses the appointment amount and rejects unknown appointments", async () => {
  const salon = await Salon.create({ name: "Billing Salon" });
  const staff = await Staff.create({ full_name: "Staff", first_name: "Staff", last_name: "Member", email: "billing-staff@gmail.com", password_hash: "unused", role: "staff", salon_id: salon._id });
  const manager = await Staff.create({ full_name: "Manager", first_name: "Manager", last_name: "Member", email: "billing-manager@gmail.com", password_hash: "unused", role: "manager", salon_id: salon._id });
  const appointment = await Appointment.create({ salon_id: salon._id, staff_id: staff._id, appointment_date: "2026-09-01", start_time: "10:00", end_time: "11:00", duration: 60, total_price: 75 });

  const response = await request(app)
    .post("/api/bills")
    .set("Authorization", `Bearer ${generateToken(manager)}`)
    .send({ appointment_id: appointment._id, total_amount: 1, payout_status: "paid", payment_method: "card" });

  expect(response.status).toBe(201);
  expect(response.body.total_amount).toBe(75);
  expect(response.body.payout_status).toBe("pending");

  const missing = await request(app)
    .post("/api/bills")
    .set("Authorization", `Bearer ${generateToken(manager)}`)
    .send({ appointment_id: "507f1f77bcf86cd799439011" });
  expect(missing.status).toBe(404);
  expect(await Bill.countDocuments()).toBe(1);
});
