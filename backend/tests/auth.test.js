import request from "supertest";
import app from "./testApp.js";
import Customer from "../models/Customer.js";
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";

const valid = (email) => ({ fullName: "Test Customer", email, phone: "0771234567", password: "Strong!Pass1" });

test("privileged role cannot be registered", async () => {
  const response = await request(app).post("/api/auth/register").send({ ...valid("role@example.com"), role: "super-admin" });
  expect(response.status).toBe(400);
  expect(await Customer.countDocuments({ email: "role@example.com" })).toBe(0);
});

test("duplicate registration uses the generic response", async () => {
  await request(app).post("/api/auth/register").send(valid("duplicate@example.com"));
  const response = await request(app).post("/api/auth/register").send(valid("duplicate@example.com"));
  expect(response.status).toBe(202);
  expect(response.body).toEqual({ message: "If this email is not already registered, your account will be created." });
});

test("valid registration creates a customer without a server error", async () => {
  const response = await request(app).post("/api/auth/register").send(valid("valid@example.com"));
  expect(response.status).toBe(201);
  expect(response.body.role).toBe("customer");
  expect(await Customer.exists({ email: "valid@example.com", role: "customer" })).toBeTruthy();
});

test("SuperAdmin hardening blocks full login", async () => {
  await Admin.create({ full_name: "Seeded", username: "seeded", email: "seeded@example.com", password: await bcrypt.hash("Strong!Pass1", 12), role: "super-admin", mustChangePassword: true, mfaEnrolled: false });
  const response = await request(app).post("/api/auth/login").send({ email: "seeded@example.com", password: "Strong!Pass1" });
  expect(response.status).toBe(200);
  expect(response.body.requiresHardening).toBe(true);
  expect(response.body.hardeningStep).toBe("change-password");
  expect(response.body.token).toBeDefined();
});

test("legacy SuperAdmin without hardening fields receives a full session", async () => {
  await Admin.collection.insertOne({ full_name: "Legacy", username: "legacy", email: "legacy@example.com", password: await bcrypt.hash("Strong!Pass1", 12), role: "super-admin" });
  const response = await request(app).post("/api/auth/login").send({ email: "legacy@example.com", password: "Strong!Pass1" });
  expect(response.status).toBe(200);
  expect(response.body.role).toBe("super-admin");
  expect(response.body.token).toBeDefined();
  expect(response.body.requiresHardening).toBeUndefined();
});
