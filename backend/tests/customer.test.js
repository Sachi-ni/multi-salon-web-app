import request from "supertest";
import app from "./testApp.js";
import Customer from "../models/Customer.js";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import Service from "../models/Service.js";
import generateToken from "../utils/generateToken.js";

test("customer listing requires authentication and customer POST is absent", async () => {
  expect((await request(app).get("/api/customers")).status).toBe(401);
  expect((await request(app).post("/api/customers").send({ name: "Unsafe" })).status).toBe(404);
});

test("preferred salon is saved but does not restrict booking another salon", async () => {
  const preferredSalon = await Salon.create({ name: "Preferred" });
  const bookingSalon = await Salon.create({ name: "Booking" });
  const staff = await Staff.create({ full_name: "Booking Staff", first_name: "Booking", last_name: "Staff", email: "booking-staff@example.com", password_hash: "unused", role: "staff", salon_id: bookingSalon._id });
  const service = await Service.create({ service_name: "Cut", base_price: 1000, duration: 60, salon_id: bookingSalon._id });
  const registration = await request(app).post("/api/auth/register").send({ fullName: "Customer", email: "booking-customer@example.com", phone: "0771234567", password: "Strong!Pass1", preferredSalonId: preferredSalon._id });
  expect(registration.status).toBe(201);
  const customer = await Customer.findOne({ email: "booking-customer@example.com" });
  expect(customer.preferredSalonId.toString()).toBe(preferredSalon._id.toString());

  const booking = await request(app).post("/api/appointments").set("Authorization", `Bearer ${generateToken(customer)}`).send({ salon_id: bookingSalon._id, service_id: service._id, staff_id: staff._id, appointment_date: "2099-01-01", start_time: "10:00" });
  expect(booking.status).toBe(201);
});
