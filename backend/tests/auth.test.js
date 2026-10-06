import request from "supertest";
import app from "./testApp.js";
import Customer from "../models/Customer.js";
import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";
import Salon from "../models/Salon.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";

const createStaffAccount = async ({ email, role = "staff", password = "Strong!Pass1", mustChangePassword } = {}) => Staff.create({
  full_name: role === "manager" ? "Test Manager" : "Test Staff",
  first_name: "Test",
  last_name: role === "manager" ? "Manager" : "Staff",
  email,
  phone: "0771234567",
  password_hash: await bcrypt.hash(password, 12),
  role,
  salon_id: new (await import("mongoose")).default.Types.ObjectId(),
  ...(mustChangePassword === undefined ? {} : { mustChangePassword }),
});

// Authentication tests must never deliver email through developer credentials.
process.env.RESEND_API_KEY = "";
process.env.EMAIL_USER = "";
process.env.EMAIL_PASS = "";

const valid = (email) => ({ fullName: "Test Customer", email, phone: "0771234567", password: "Strong!Pass1" });

test.each([
  "/api/auth/login",
  "/api/staff/login",
  "/api/customers/login",
])("%s returns 429 after the account attempt threshold", async (path) => {
  const identifier = `rate-limit-${path.replace(/[^a-z]/g, "-")}@example.com`;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await request(app).post(path).send({ email: identifier, password: "wrong-password" });
    expect(response.status).toBe(401);
  }

  const limited = await request(app).post(path).send({ email: identifier, password: "wrong-password" });
  expect(limited.status).toBe(429);
  expect(limited.body).toEqual({ message: "Too many requests. Please try again later." });
});

test("admin, staff, and customer login failures use identical generic responses", async () => {
  const password = "Strong!Pass1";
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.create({
    full_name: "Login Admin", username: "login-admin", email: "login-admin@example.com",
    password: passwordHash, role: "manager",
  });
  const staff = await createStaffAccount({ email: "login-staff@example.com", password });
  const customer = await Customer.create({
    name: "Login Customer", email: "login-customer@example.com", password_hash: passwordHash,
  });

  const loginCases = [
    { path: "/api/auth/login", email: admin.email },
    { path: "/api/staff/login", email: staff.email },
    { path: "/api/customers/login", email: customer.email },
  ];

  for (const { path, email } of loginCases) {
    const missingAccount = await request(app).post(path).send({ email: `missing-${email}`, password: "wrong-password" });
    const wrongPassword = await request(app).post(path).send({ email, password: "wrong-password" });
    expect(missingAccount.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(missingAccount.body).toEqual({ message: "Invalid email or password" });
    expect(wrongPassword.body).toEqual(missingAccount.body);
  }
});

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
  const salon = await Salon.create({ name: "Registration Salon" });
  const response = await request(app).post("/api/auth/register").send({
    ...valid("valid@example.com"),
    preferredSalonId: String(salon._id),
  });
  expect(response.status).toBe(201);
  expect(response.body.role).toBe("customer");
  expect(await Customer.exists({
    email: "valid@example.com",
    role: "customer",
    preferredSalonId: salon._id,
  })).toBeTruthy();
});

test("registration rejects a missing full name before creating a customer", async () => {
  const { fullName, ...registration } = valid("missing-name@example.com");
  const response = await request(app).post("/api/auth/register")
    .set("X-Forwarded-For", "192.0.2.11")
    .send(registration);

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Full name is required");
  expect(await Customer.exists({ email: "missing-name@example.com" })).toBeFalsy();
});

test("registration rejects a missing password before creating a customer", async () => {
  const { password, ...registration } = valid("missing-password@example.com");
  const response = await request(app).post("/api/auth/register")
    .set("X-Forwarded-For", "192.0.2.12")
    .send(registration);

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Password is required");
  expect(await Customer.exists({ email: "missing-password@example.com" })).toBeFalsy();
});

test.each([
  ["malformed", "not-an-object-id"],
  ["nonexistent", "000000000000000000000000"],
])("registration rejects a %s preferred salon id", async (caseName, preferredSalonId) => {
  const email = `invalid-salon-${caseName}@example.com`;
  const response = await request(app).post("/api/auth/register").send({
    ...valid(email),
    preferredSalonId,
  }).set("X-Forwarded-For", caseName === "malformed" ? "192.0.2.13" : "192.0.2.14");

  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Preferred salon is invalid or does not exist");
  expect(await Customer.exists({ email })).toBeFalsy();
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

test.each(["staff", "manager"])("new %s login is restricted to the change-password hardening flow", async (role) => {
  const staff = await createStaffAccount({ email: `${role}-hardening@example.com`, role, mustChangePassword: true });

  const login = await request(app).post("/api/staff/login")
    .send({ email: staff.email, password: "Strong!Pass1" });
  expect(login.status).toBe(200);
  expect(login.body.requiresHardening).toBe(true);
  expect(login.body.hardeningStep).toBe("change-password");
  expect(jwt.verify(login.body.token, process.env.JWT_SECRET)).toMatchObject({
    id: String(staff._id), role, purpose: "change-password",
  });

  // The scoped token cannot call ordinary protected endpoints.
  expect((await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${login.body.token}`)).status).toBe(403);
  expect((await request(app).post("/api/auth/change-password")
    .set("Authorization", `Bearer ${login.body.token}`)
    .send({ password: "Strong!Pass1" })).status).toBe(400);

  const changed = await request(app).post("/api/auth/change-password")
    .set("Authorization", `Bearer ${login.body.token}`)
    .send({ password: "Replacement!Pass1" });
  expect(changed.status).toBe(200);
  expect(changed.body.role).toBe(role);
  expect((await Staff.findById(staff._id)).mustChangePassword).toBe(false);
  expect((await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${changed.body.token}`)).status).toBe(200);
});

test("a flagged staff account is blocked on all normal protected API routes even with a normal JWT", async () => {
  const staff = await createStaffAccount({ email: "protected-block@example.com", mustChangePassword: true });
  const { default: generateToken } = await import("../utils/generateToken.js");
  const response = await request(app).get("/api/auth/profile")
    .set("Authorization", `Bearer ${generateToken(staff)}`);
  expect(response.status).toBe(403);
  expect(response.body.message).toMatch(/required password change/i);
});

test("legacy staff without the flag receives a normal session, while phone is not accepted as a password", async () => {
  const staff = await createStaffAccount({ email: "legacy-staff@example.com" });
  const phonePassword = await request(app).post("/api/staff/login")
    .send({ email: staff.email, password: staff.phone });
  expect(phonePassword.status).toBe(401);

  const login = await request(app).post("/api/staff/login")
    .send({ email: staff.email, password: "Strong!Pass1" });
  expect(login.status).toBe(200);
  expect(login.body.requiresHardening).toBeUndefined();
  expect(login.body.token).toBeDefined();
});

test("staff phone login treats regex metacharacters in the identifier literally", async () => {
  const staff = await createStaffAccount({ email: "regex-phone@example.com", password: "Strong!Pass1" });
  const response = await request(app).post("/api/staff/login")
    .send({ email: "07712(.*)|99999", password: "Strong!Pass1" });

  expect(response.status).toBe(401);
  expect(response.body).toEqual({ message: "Invalid email or password" });
  expect(await Staff.findById(staff._id)).toBeTruthy();
});

test("profile password change requires and verifies the current password", async () => {
  const currentPassword = "Strong!Pass1";
  const customer = await Customer.create({
    name: "Profile Customer",
    email: "profile-password@example.com",
    phone: "0771234567",
    password_hash: await bcrypt.hash(currentPassword, 12),
  });
  const token = jwt.sign({
    id: String(customer._id),
    role: customer.role,
    iat: Math.floor(Date.now() / 1000) - 10,
  }, process.env.JWT_SECRET);
  const sameSecondToken = jwt.sign({
    id: String(customer._id),
    role: customer.role,
  }, process.env.JWT_SECRET);

  const changed = await request(app).put(`/api/auth/user/${customer._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ password: "Replacement!Pass1", currentPassword });

  expect(changed.status).toBe(200);
  const saved = await Customer.findById(customer._id);
  expect(await bcrypt.compare("Replacement!Pass1", saved.password_hash)).toBe(true);
  expect(await bcrypt.compare(currentPassword, saved.password_hash)).toBe(false);
  expect(saved.passwordChangedAt).toBeInstanceOf(Date);
  expect((await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${token}`)).status).toBe(401);
  expect((await request(app).get("/api/auth/profile")
    .set("Authorization", `Bearer ${sameSecondToken}`)).status).toBe(401);
  const tokenWithoutIssuedAt = jwt.sign({ id: String(customer._id), role: customer.role }, process.env.JWT_SECRET, { noTimestamp: true });
  expect((await request(app).get("/api/auth/profile")
    .set("Authorization", `Bearer ${tokenWithoutIssuedAt}`)).status).toBe(401);
  expect((await request(app).get("/api/auth/profile")
    .set("Authorization", `Bearer ${changed.body.token}`)).status).toBe(200);
});

test.each(["admin", "staff"])("%s profile password changes revoke its earlier JWT", async (accountType) => {
  const account = accountType === "admin"
    ? await Admin.create({
      full_name: "Profile Admin", username: "profile-admin", email: "profile-admin@example.com",
      password: await bcrypt.hash("Strong!Pass1", 12), role: "manager",
    })
    : await createStaffAccount({ email: "profile-staff@example.com" });
  const passwordField = accountType === "admin" ? "password" : "password_hash";
  const oldToken = jwt.sign({
    id: String(account._id),
    role: account.role,
    iat: Math.floor(Date.now() / 1000) - 10,
  }, process.env.JWT_SECRET);

  const changed = await request(app).put(`/api/auth/user/${account._id}`)
    .set("Authorization", `Bearer ${oldToken}`)
    .send({ password: "Replacement!Pass1", currentPassword: "Strong!Pass1" });

  expect(changed.status).toBe(200);
  const saved = await (accountType === "admin" ? Admin : Staff).findById(account._id);
  expect(saved.passwordChangedAt).toBeInstanceOf(Date);
  expect(await bcrypt.compare("Replacement!Pass1", saved[passwordField])).toBe(true);
  expect((await request(app).get("/api/auth/profile")
    .set("Authorization", `Bearer ${oldToken}`)).status).toBe(401);
  expect((await request(app).get("/api/auth/profile")
    .set("Authorization", `Bearer ${changed.body.token}`)).status).toBe(200);
});

test("accounts without a password-change timestamp keep accepting existing JWTs", async () => {
  const accounts = [
    await Admin.create({
      full_name: "Legacy Admin", username: "legacy-admin", email: "legacy-admin@example.com",
      password: await bcrypt.hash("Strong!Pass1", 12), role: "manager",
    }),
    await createStaffAccount({ email: "legacy-timestamp-staff@example.com" }),
    await Customer.create({
      name: "Legacy Customer", email: "legacy-timestamp-customer@example.com",
      password_hash: await bcrypt.hash("Strong!Pass1", 12),
    }),
  ];

  for (const account of accounts) {
    expect(account.passwordChangedAt).toBeNull();
    const token = jwt.sign({ id: String(account._id), role: account.role }, process.env.JWT_SECRET);
    const response = await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
  }
});

test("production authenticated requests do not log identity data", async () => {
  const customer = await Customer.create({
    name: "Production Log Customer",
    email: "production-log-customer@example.com",
    password_hash: "unused",
  });
  const token = jwt.sign({ id: String(customer._id), role: customer.role }, process.env.JWT_SECRET);
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

  try {
    const response = await request(app).get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(consoleLog).not.toHaveBeenCalled();
  } finally {
    consoleLog.mockRestore();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

test.each([
  ["wrong", "Incorrect!Pass1", 401, "Current password is incorrect"],
  ["missing", undefined, 400, "Current password is required to change your password"],
])("profile password change is rejected when the current password is %s", async (_caseName, currentPassword, status, message) => {
  const customer = await Customer.create({
    name: "Unchanged Customer",
    email: `profile-${_caseName}-password@example.com`,
    password_hash: await bcrypt.hash("Strong!Pass1", 12),
  });
  const token = jwt.sign({ id: String(customer._id), role: customer.role }, process.env.JWT_SECRET);
  const body = { full_name: "Must Not Update", password: "Replacement!Pass1" };
  if (currentPassword !== undefined) body.currentPassword = currentPassword;

  const response = await request(app).put(`/api/auth/user/${customer._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

  expect(response.status).toBe(status);
  expect(response.body.message).toBe(message);
  const saved = await Customer.findById(customer._id);
  expect(saved.name).toBe("Unchanged Customer");
  expect(await bcrypt.compare("Strong!Pass1", saved.password_hash)).toBe(true);
});

test("profile fields and image can be updated without requesting a password change", async () => {
  const customer = await Customer.create({
    name: "Before Update",
    email: "profile-fields@example.com",
    phone: "0771234567",
    password_hash: await bcrypt.hash("Strong!Pass1", 12),
  });
  const token = jwt.sign({ id: String(customer._id), role: customer.role }, process.env.JWT_SECRET);
  const cloudinaryKeys = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  const previousCloudinaryConfig = cloudinaryKeys.map((key) => process.env[key]);
  cloudinaryKeys.forEach((key) => { process.env[key] = ""; });

  let uploadedImage;
  try {
    const response = await request(app).put(`/api/auth/user/${customer._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("full_name", "After Update")
      .field("email", "profile-updated@example.com")
      .field("phone", "0777654321")
      .attach("image", Buffer.from("profile image"), { filename: "profile.png", contentType: "image/png" });

    expect(response.status).toBe(200);
    uploadedImage = response.body.image;
    expect(uploadedImage).toMatch(/^uploads\//);
    const saved = await Customer.findById(customer._id);
    expect(saved).toMatchObject({
      name: "After Update",
      email: "profile-updated@example.com",
      phone: "0777654321",
      image: uploadedImage,
    });
    expect(await bcrypt.compare("Strong!Pass1", saved.password_hash)).toBe(true);
  } finally {
    if (uploadedImage) await unlink(join(process.cwd(), uploadedImage)).catch(() => {});
    cloudinaryKeys.forEach((key, index) => {
      if (previousCloudinaryConfig[index] === undefined) delete process.env[key];
      else process.env[key] = previousCloudinaryConfig[index];
    });
  }
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

test.each([
  {
    path: "/api/auth/verify-password-reset-otp",
    body: { email: "no-otp-account@example.com", otpCode: "000000" },
  },
  {
    path: "/api/auth/reset-password",
    body: { newPassword: "Strong!Pass1" },
  },
])("$path has a route-level limit independent of reset-account lockout", async ({ path, body }) => {
  const clientIp = "198.51.100.77";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request(app)
      .post(path)
      .set("X-Forwarded-For", clientIp)
      .send(body);
    expect(response.status).toBe(400);
  }

  const limited = await request(app)
    .post(path)
    .set("X-Forwarded-For", clientIp)
    .send(body);
  expect(limited.status).toBe(429);
  expect(limited.body).toEqual({ message: "Too many requests. Please try again later." });
});

test("password reset OTP invalid responses are generic, lock after five tries, and issue a distinct reset session", async () => {
  const admin = await Admin.create({
    full_name: "Reset Admin", username: "resetadmin", email: "reset-admin@example.com",
    password: await bcrypt.hash("Strong!Pass1", 12), role: "manager",
    passwordResetOtpCodeHash: (await import("../utils/emailOtp.js")).hashOtpCode("123456"),
    passwordResetOtpExpires: new Date(Date.now() + 600000),
  });

  const invalid = await request(app).post("/api/auth/verify-password-reset-otp").set("X-Forwarded-For", "198.51.100.1")
    .send({ email: "reset-admin@example.com", otpCode: "000000" });
  const nonexistent = await request(app).post("/api/auth/verify-password-reset-otp").set("X-Forwarded-For", "198.51.100.2")
    .send({ email: "nobody@example.com", otpCode: "000000" });
  expect(invalid.status).toBe(400);
  expect(nonexistent.status).toBe(400);
  expect(invalid.body).toEqual({ message: "Invalid or expired code" });
  expect(nonexistent.body).toEqual(invalid.body);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await request(app).post("/api/auth/verify-password-reset-otp").set("X-Forwarded-For", `198.51.100.${attempt + 3}`)
      .send({ email: "reset-admin@example.com", otpCode: "000000" });
  }
  const locked = await Admin.findById(admin._id);
  expect(locked.passwordResetOtpAttempts).toBe(5);

  // Six consecutive wrong submissions: the sixth is rejected without a sixth increment.
  const sixthWrongAttempt = await request(app).post("/api/auth/verify-password-reset-otp").set("X-Forwarded-For", "198.51.100.7")
    .send({ email: "reset-admin@example.com", otpCode: "000000" });
  expect(sixthWrongAttempt.status).toBe(400);
  expect(sixthWrongAttempt.body).toEqual({ message: "Invalid or expired code" });
  expect((await Admin.findById(admin._id)).passwordResetOtpAttempts).toBe(5);

  // A correct OTP is also rejected once the account is locked.
  const lockedCorrectAttempt = await request(app).post("/api/auth/verify-password-reset-otp").set("X-Forwarded-For", "198.51.100.8")
    .send({ email: "reset-admin@example.com", otpCode: "123456" });
  expect(lockedCorrectAttempt.status).toBe(400);
  expect(lockedCorrectAttempt.body).toEqual({ message: "Invalid or expired code" });

  // A newly issued OTP starts a fresh attempt window; simulate that separately.
  locked.passwordResetOtpCodeHash = (await import("../utils/emailOtp.js")).hashOtpCode("123456");
  locked.passwordResetOtpExpires = new Date(Date.now() + 600000);
  locked.passwordResetOtpAttempts = 0;
  await locked.save();
  const verified = await request(app).post("/api/auth/verify-password-reset-otp").set("X-Forwarded-For", "198.51.100.9")
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
  const staleToken = jwt.sign({
    id: String(staff._id),
    role: staff.role,
    iat: Math.floor(Date.now() / 1000) - 10,
  }, process.env.JWT_SECRET);
  expect((await request(app).get("/api/auth/profile")
    .set("Authorization", `Bearer ${staleToken}`)).status).toBe(200);

  const reset = await request(app).post("/api/auth/reset-password")
    .send({ resetSessionToken: verified.body.resetSessionToken, newPassword: "NewStrong!Pass1" });
  expect(reset.status).toBe(200);
  const saved = await Staff.findById(staff._id);
  expect(await bcrypt.compare("NewStrong!Pass1", saved.password_hash)).toBe(true);
  expect(saved.passwordChangedAt).toBeInstanceOf(Date);
  expect(saved.passwordResetSessionHash).toBeNull();
  expect((await request(app).get("/api/auth/profile")
    .set("Authorization", `Bearer ${staleToken}`)).status).toBe(401);

  const freshLogin = await request(app).post("/api/staff/login")
    .send({ email: staff.email, password: "NewStrong!Pass1" });
  expect(freshLogin.status).toBe(200);
  expect((await request(app).get("/api/auth/profile")
    .set("Authorization", `Bearer ${freshLogin.body.token}`)).status).toBe(200);

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
