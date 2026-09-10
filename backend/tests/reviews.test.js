import request from "supertest";
import app from "./testApp.js";
import Review from "../models/Review.js";
import Appointment from "../models/Appointment.js";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import Customer from "../models/Customer.js";
import generateToken from "../utils/generateToken.js";

test("only the customer of a completed appointment can create a review", async () => {
  const salon = await Salon.create({ name: "Review Salon" });
  const staff = await Staff.create({ full_name: "Staff", first_name: "Staff", last_name: "Member", email: "review-staff@gmail.com", password_hash: "unused", role: "staff", salon_id: salon._id });
  const customer = await Customer.create({ name: "Customer", email: "review-customer@gmail.com", password_hash: "unused" });
  const otherCustomer = await Customer.create({ name: "Other", email: "review-other@gmail.com", password_hash: "unused" });
  const appointment = await Appointment.create({ customer_id: customer._id, salon_id: salon._id, staff_id: staff._id, appointment_date: "2026-09-01", start_time: "10:00", end_time: "11:00", duration: 60, status: "completed" });

  const response = await request(app)
    .post("/api/reviews")
    .set("Authorization", `Bearer ${generateToken(customer)}`)
    .send({ appointment_id: appointment._id, rating: 5, comment: "Great", customer_id: otherCustomer._id, role: "super-admin" });

  expect(response.status).toBe(201);
  expect(response.body.appointment_id.toString()).toBe(appointment._id.toString());
  expect(response.body.customer_id).toBeUndefined();
  expect(await Review.countDocuments()).toBe(1);

  const unauthorized = await request(app)
    .post("/api/reviews")
    .set("Authorization", `Bearer ${generateToken(otherCustomer)}`)
    .send({ appointment_id: appointment._id, rating: 1, comment: "No booking" });
  expect(unauthorized.status).toBe(403);
});
