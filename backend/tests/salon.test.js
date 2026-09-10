import request from "supertest";
import app from "./testApp.js";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import Admin from "../models/Admin.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";

test("salon mutations require authentication", async () => {
  const salon = await Salon.create({ name: "Protected" });
  expect((await request(app).put(`/api/salons/${salon._id}`).send({ name: "Changed" })).status).toBe(401);
  expect((await request(app).delete(`/api/salons/${salon._id}`)).status).toBe(401);
});

test("manager cannot update salon metadata", async () => {
  const salon = await Salon.create({ name: "Protected" });
  const manager = await Staff.create({ full_name: "Manager", first_name: "Manager", last_name: "A", email: "manager-salon@example.com", password_hash: "unused", role: "manager", salon_id: salon._id });
  const response = await request(app).put(`/api/salons/${salon._id}`).set("Authorization", `Bearer ${generateToken(manager)}`).send({ name: "Changed" });
  expect(response.status).toBe(403);
});

test("super-admin salon update ignores manager fields", async () => {
  const salon = await Salon.create({ name: "Protected" });
  const manager = await Staff.create({ full_name: "Original Manager", first_name: "Original", last_name: "Manager", email: "original-manager@example.com", phone: "0771234567", password_hash: "unused", role: "manager", salon_id: salon._id });
  const admin = await Admin.create({ full_name: "Super", username: "super-salon", email: "super-salon@example.com", password: await bcrypt.hash("Strong!Pass1", 12), role: "super-admin" });
  const response = await request(app).put(`/api/salons/${salon._id}`).set("Authorization", `Bearer ${generateToken(admin)}`).send({ name: "Updated", managerName: "Attacker", managerEmail: "attacker@example.com", managerPassword: "Strong!Pass1" });
  expect(response.status).toBe(200);
  const unchanged = await Staff.findById(manager._id);
  expect(unchanged.full_name).toBe("Original Manager");
  expect(unchanged.email).toBe("original-manager@example.com");
});
