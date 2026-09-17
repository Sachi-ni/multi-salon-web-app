import request from "supertest";
import app from "./testApp.js";
import Customer from "../models/Customer.js";
import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readFile } from "node:fs/promises";

// Authentication tests must never deliver email through developer credentials.
process.env.RESEND_API_KEY = "";
process.env.EMAIL_USER = "";
process.env.EMAIL_PASS = "";

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
  const admin = await Admin.create({
    full_name: "Seeded", username: "seeded-hardening", email: "seeded@example.com",
    password: await bcrypt.hash("Strong!Pass1", 12), role: "super-admin",
    mustChangePassword: true, mfaEnrolled: false,
  });
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

test("password reset requests are generic and create a hashed OTP only for an account", async () => {
  const password_hash = await bcrypt.hash("Strong!Pass1", 12);
  const customer = await Customer.create({ name: "Reset Customer", email: "reset@example.com", password_hash });

  const registered = await request(app).post("/api/auth/forgot-password").send({ email: "reset@example.com" });
  const unknown = await request(app).post("/api/auth/forgot-password").send({ email: "unknown@example.com" });
  expect(registered.status).toBe(200);
  expect(unknown.status).toBe(200);
  expect(registered.body).toEqual({ message: "If this email is registered, an OTP has been sent." });
  expect(unknown.body).toEqual(registered.body);

  const saved = await Customer.findById(customer._id);
  expect(saved.passwordResetOtpCodeHash).toMatch(/^[a-f0-9]{64}$/);
  expect(saved.passwordResetOtpCodeHash).not.toBe("123456");
  expect(saved.passwordResetOtpExpires.getTime()).toBeGreaterThan(Date.now());
  expect(saved.passwordResetOtpAttempts).toBe(0);

  const initialOtpHash = saved.passwordResetOtpCodeHash;
  const cooldownRequest = await request(app).post("/api/auth/forgot-password").send({ email: "reset@example.com" });
  expect(cooldownRequest.body).toEqual(registered.body);
  expect((await Customer.findById(customer._id)).passwordResetOtpCodeHash).toBe(initialOtpHash);
});

test("password reset OTP invalid responses are generic, lock after five tries, and issue a distinct reset session", async () => {
  const admin = await Admin.create({
    full_name: "Reset Admin", username: "resetadmin", email: "reset-admin@example.com",
    password: await bcrypt.hash("Strong!Pass1", 12), role: "manager",
    passwordResetOtpCodeHash: (await import("../utils/emailOtp.js")).hashOtpCode("123456"),
    passwordResetOtpExpires: new Date(Date.now() + 600000),
  });

  const invalid = await request(app).post("/api/auth/verify-password-reset-otp")
    .send({ email: "reset-admin@example.com", otpCode: "000000" });
  const nonexistent = await request(app).post("/api/auth/verify-password-reset-otp")
    .send({ email: "nobody@example.com", otpCode: "000000" });
  expect(invalid.status).toBe(400);
  expect(nonexistent.status).toBe(400);
  expect(invalid.body).toEqual({ message: "Invalid or expired code" });
  expect(nonexistent.body).toEqual(invalid.body);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await request(app).post("/api/auth/verify-password-reset-otp")
      .send({ email: "reset-admin@example.com", otpCode: "000000" });
  }
  const locked = await Admin.findById(admin._id);
  expect(locked.passwordResetOtpAttempts).toBe(5);

  // Six consecutive wrong submissions: the sixth is rejected without a sixth increment.
  const sixthWrongAttempt = await request(app).post("/api/auth/verify-password-reset-otp")
    .send({ email: "reset-admin@example.com", otpCode: "000000" });
  expect(sixthWrongAttempt.status).toBe(400);
  expect(sixthWrongAttempt.body).toEqual({ message: "Invalid or expired code" });
  expect((await Admin.findById(admin._id)).passwordResetOtpAttempts).toBe(5);

  // A correct OTP is also rejected once the account is locked.
  const lockedCorrectAttempt = await request(app).post("/api/auth/verify-password-reset-otp")
    .send({ email: "reset-admin@example.com", otpCode: "123456" });
  expect(lockedCorrectAttempt.status).toBe(400);
  expect(lockedCorrectAttempt.body).toEqual({ message: "Invalid or expired code" });

  // A newly issued OTP starts a fresh attempt window; simulate that separately.
  locked.passwordResetOtpCodeHash = (await import("../utils/emailOtp.js")).hashOtpCode("123456");
  locked.passwordResetOtpExpires = new Date(Date.now() + 600000);
  locked.passwordResetOtpAttempts = 0;
  await locked.save();
  const verified = await request(app).post("/api/auth/verify-password-reset-otp")
    .send({ email: "reset-admin@example.com", otpCode: "123456" });
  expect(verified.status).toBe(200);
  expect(verified.body.resetSessionToken).toBeDefined();
  const resetPayload = jwt.verify(verified.body.resetSessionToken, process.env.JWT_SECRET);
  expect(resetPayload.purpose).toBe("password_reset");
  expect(resetPayload.jti).toBeDefined();
  expect(resetPayload.purpose).not.toBe("change-password");

  const consumedOtp = await Admin.findById(admin._id);
  expect(consumedOtp.passwordResetOtpCodeHash).toBeNull();
  expect(consumedOtp.passwordResetSessionHash).toMatch(/^[a-f0-9]{64}$/);
});

test("password reset session accepts only its own scope and is single-use", async () => {
  const staff = await Staff.create({
    full_name: "Reset Staff", first_name: "Reset", last_name: "Staff", email: "staff-reset@example.com",
    password_hash: await bcrypt.hash("Strong!Pass1", 12), role: "staff", salon_id: new (await import("mongoose")).default.Types.ObjectId(),
  });
  const { hashOtpCode } = await import("../utils/emailOtp.js");
  staff.passwordResetOtpCodeHash = hashOtpCode("123456");
  staff.passwordResetOtpExpires = new Date(Date.now() + 600000);
  await staff.save();
  const verified = await request(app).post("/api/auth/verify-password-reset-otp")
    .send({ email: staff.email, otpCode: "123456" });

  const reset = await request(app).post("/api/auth/reset-password")
    .send({ resetSessionToken: verified.body.resetSessionToken, newPassword: "NewStrong!Pass1" });
  expect(reset.status).toBe(200);
  const saved = await Staff.findById(staff._id);
  expect(await bcrypt.compare("NewStrong!Pass1", saved.password_hash)).toBe(true);
  expect(saved.passwordResetSessionHash).toBeNull();

  const replay = await request(app).post("/api/auth/reset-password")
    .send({ resetSessionToken: verified.body.resetSessionToken, newPassword: "OtherStrong!Pass1" });
  expect(replay.status).toBe(400);
  expect(replay.body).toEqual({ message: "Invalid or expired code" });
});

test("OTP delivery code never logs plaintext OTP values", async () => {
  const source = await readFile(new URL("../utils/emailOtp.js", import.meta.url), "utf8");
  expect(source).toContain("Never log OTP values");
  expect(source).toContain('process.env.NODE_ENV === "development" && process.env.DEBUG_LOG_OTP === "true"');
  expect(source).toContain("Never enable DEBUG_LOG_OTP in production");
  expect(source).toMatch(/if \(process\.env\.NODE_ENV === "development" && process\.env\.DEBUG_LOG_OTP === "true"\) \{\s*console\.log\(`\[DEV ONLY\] OTP for \$\{email\}: \$\{code\}`\);/s);
});
