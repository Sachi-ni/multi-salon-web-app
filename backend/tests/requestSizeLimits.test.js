import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import app from "./testApp.js";

test("JSON bodies larger than 10 KB receive a clean 413 response", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ fullName: "Oversized", email: "large@example.com", password: "x".repeat(10 * 1024) });

  expect(response.status).toBe(413);
  expect(response.headers["content-type"]).toMatch(/application\/json/);
  expect(response.body).toEqual({ message: "Request body exceeds the 10 KB limit" });
});

test("profile images larger than 5 MB receive a clean 413 response", async () => {
  const customer = await Customer.create({
    name: "Upload Customer",
    email: "upload-limit@example.com",
    password_hash: await bcrypt.hash("Strong!Pass1", 10),
  });
  const token = jwt.sign({ id: String(customer._id), role: customer.role }, process.env.JWT_SECRET);
  const response = await request(app)
    .put(`/api/auth/user/${customer._id}`)
    .set("Authorization", `Bearer ${token}`)
    .attach("image", Buffer.alloc(5 * 1024 * 1024 + 1), { filename: "oversized.png", contentType: "image/png" });

  expect(response.status).toBe(413);
  expect(response.headers["content-type"]).toMatch(/application\/json/);
  expect(response.body).toEqual({ message: "Profile image exceeds the 5 MB limit" });
});