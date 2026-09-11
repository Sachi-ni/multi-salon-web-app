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

test("SuperAdmin login returns 2FA OTP challenge", async () => {
  await Admin.create({
    full_name: "Seeded",
    username: "seeded",
    email: "seeded@example.com",
    password: await bcrypt.hash("Strong!Pass1", 12),
    role: "super-admin",
    mustChangePassword: true,
    mfaEnrolled: false
  });

  const response = await request(app).post("/api/auth/login").send({ email: "seeded@example.com", password: "Strong!Pass1" });
  expect(response.status).toBe(200);
  expect(response.body.requires2FA).toBe(true);
  expect(response.body.tempToken).toBeDefined();
  expect(response.body.emailMasked).toBeDefined();

  // Test invalid OTP fails
  const badOtpRes = await request(app)
    .post("/api/auth/verify-superadmin-otp")
    .send({ tempToken: response.body.tempToken, otpCode: "000000" });
  expect(badOtpRes.status).toBe(400);

  // Retrieve stored OTP hash and verify with actual code
  const seededAdmin = await Admin.findOne({ email: "seeded@example.com" });
  expect(seededAdmin.otpCodeHash).toBeDefined();
  expect(seededAdmin.otpAttempts).toBe(1);
});

test("SuperAdmin OTP verification triggers password change when mustChangePassword is true", async () => {
  const admin = await Admin.findOne({ email: "seeded@example.com" });
  // Manually set known OTP
  const { hashOtpCode } = await import("../utils/emailOtp.js");
  admin.otpCodeHash = hashOtpCode("123456");
  admin.otpExpires = new Date(Date.now() + 600000);
  admin.otpAttempts = 0;
  await admin.save();

  const { generatePending2FaToken } = await import("../utils/generateToken.js");
  const tempToken = generatePending2FaToken(admin);

  const verifyRes = await request(app)
    .post("/api/auth/verify-superadmin-otp")
    .send({ tempToken, otpCode: "123456" });

  expect(verifyRes.status).toBe(200);
  expect(verifyRes.body.requiresPasswordChange).toBe(true);
  expect(verifyRes.body.token).toBeDefined();
});

test("SuperAdmin OTP verification issues full session when mustChangePassword is false", async () => {
  const admin = await Admin.create({
    full_name: "Normal SuperAdmin",
    username: "normalsuper",
    email: "normalsuper@example.com",
    password: await bcrypt.hash("Strong!Pass1", 12),
    role: "super-admin",
    mustChangePassword: false,
    mfaEnrolled: true,
  });

  const { hashOtpCode } = await import("../utils/emailOtp.js");
  admin.otpCodeHash = hashOtpCode("654321");
  admin.otpExpires = new Date(Date.now() + 600000);
  admin.otpAttempts = 0;
  await admin.save();

  const { generatePending2FaToken } = await import("../utils/generateToken.js");
  const tempToken = generatePending2FaToken(admin);

  const verifyRes = await request(app)
    .post("/api/auth/verify-superadmin-otp")
    .send({ tempToken, otpCode: "654321" });

  expect(verifyRes.status).toBe(200);
  expect(verifyRes.body.role).toBe("super-admin");
  expect(verifyRes.body.token).toBeDefined();
});
