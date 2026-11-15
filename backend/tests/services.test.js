import request from "supertest";
import app from "./testApp.js";
import mongoose from "mongoose";
import Service from "../models/Service.js";
import Salon from "../models/Salon.js";
import ServiceCategory from "../models/ServiceCategory.js";
import Staff from "../models/Staff.js";
import Customer from "../models/Customer.js";
import Feedback from "../models/Feedback.js";
import generateToken from "../utils/generateToken.js";

test("service writes use the manager salon and validate related records", async () => {
  const salonA = await Salon.create({ name: "Salon A" });
  const salonB = await Salon.create({ name: "Salon B" });
  const category = await ServiceCategory.create({ category_name: "Hair" });
  const manager = await Staff.create({ full_name: "Manager", first_name: "Manager", last_name: "A", email: "service-manager@gmail.com", password_hash: "unused", role: "manager", salon_id: salonA._id });
  const token = generateToken(manager);

  const response = await request(app)
    .post("/api/services")
    .set("Authorization", `Bearer ${token}`)
    .send({ service_name: "Cut", base_price: 30, duration: 30, category_id: category._id, salon_id: salonB._id, role: "super-admin" });

  expect(response.status).toBe(201);
  expect(response.body.salon_id.toString()).toBe(salonA._id.toString());
  expect(response.body.role).toBeUndefined();

  const update = await request(app)
    .put(`/api/services/${response.body._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ base_price: 40, salon_id: salonB._id, payout_status: "paid" });
  expect(update.status).toBe(200);
  expect(update.body.base_price).toBe(40);
  expect(update.body.salon_id.toString()).toBe(salonA._id.toString());
  expect(update.body.payout_status).toBeUndefined();

  const missingCategory = await request(app)
    .post("/api/services")
    .set("Authorization", `Bearer ${token}`)
    .send({ service_name: "Color", base_price: 50, duration: 45, category_id: "507f1f77bcf86cd799439011" });
  expect(missingCategory.status).toBe(404);

  const categoryResponse = await request(app)
    .post("/api/services/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ category_name: "Nails", role: "super-admin" });
  expect(categoryResponse.status).toBe(201);
  expect(categoryResponse.body.role).toBeUndefined();
  expect(await Service.countDocuments()).toBe(1);
});

test("service listings include feedback rating and count", async () => {
  const salon = await Salon.create({ name: "Rated Salon" });
  const service = await Service.create({
    service_name: "Rated Cut",
    base_price: 30,
    duration: 30,
    salon_id: salon._id,
  });
  const customer = await Customer.create({
    name: "Customer",
    email: "service-rating-customer@gmail.com",
    password_hash: "unused",
  });

  await Feedback.create([
    {
      appointment_id: new mongoose.Types.ObjectId(),
      salon_id: salon._id,
      customer_id: customer._id,
      service_id: service._id,
      staff_id: new mongoose.Types.ObjectId(),
      serviceRating: 4,
      staffRating: 5,
    },
    {
      appointment_id: new mongoose.Types.ObjectId(),
      salon_id: salon._id,
      customer_id: customer._id,
      service_id: service._id,
      staff_id: new mongoose.Types.ObjectId(),
      serviceRating: 5,
      staffRating: 4,
    },
  ]);

  const response = await request(app)
    .get(`/api/services?salonId=${salon._id}`)
    .set("Authorization", `Bearer ${generateToken({ _id: customer._id, role: "customer" })}`);

  expect(response.status).toBe(200);
  expect(response.body[0].rating).toBe(4.5);
  expect(response.body[0].ratingCount).toBe(2);
});
