import request from "supertest";
import app from "./testApp.js";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import Admin from "../models/Admin.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import { jest } from "@jest/globals";

const createSalonWithManager = async ({ name = "Test Salon", email = "manager-salon@example.com" } = {}) => {
  const salon = await Salon.create({
    name,
    location: "10 Main Street",
    open_time: "09:00",
    close_time: "18:00",
  });
  const manager = await Staff.create({
    full_name: "Salon Manager",
    first_name: "Salon",
    last_name: "Manager",
    email,
    phone: "0771234567",
    password_hash: "unused",
    role: "manager",
    salon_id: salon._id,
  });
  return { salon, manager };
};

const expectPublicSalonFields = (responseSalon, salon) => {
  expect(responseSalon).toMatchObject({
    name: salon.name,
    location: salon.location,
    open_time: salon.open_time,
    close_time: salon.close_time,
  });
};

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

test("public salon endpoints omit manager contacts and retain public fields", async () => {
  const { salon } = await createSalonWithManager();
  const listResponse = await request(app).get("/api/salons");
  const detailResponse = await request(app).get(`/api/salons/${salon._id}`);
  const listedSalon = listResponse.body.find((item) => item._id === String(salon._id));

  expect(listResponse.status).toBe(200);
  expect(detailResponse.status).toBe(200);
  for (const responseSalon of [listedSalon, detailResponse.body]) {
    expect(responseSalon).not.toHaveProperty("managerEmail");
    expect(responseSalon).not.toHaveProperty("managerPhone");
    expectPublicSalonFields(responseSalon, salon);
  }
});

test("manager sees contacts only for their own salon", async () => {
  const { salon, manager } = await createSalonWithManager();
  const otherSalon = await createSalonWithManager({ name: "Other Salon", email: "other-manager@example.com" });
  const token = generateToken(manager);

  const listResponse = await request(app).get("/api/salons").set("Authorization", `Bearer ${token}`);
  const ownListedSalon = listResponse.body.find((item) => item._id === String(salon._id));
  const otherListedSalon = listResponse.body.find((item) => item._id === String(otherSalon.salon._id));
  const ownDetailResponse = await request(app).get(`/api/salons/${salon._id}`).set("Authorization", `Bearer ${token}`);
  const otherDetailResponse = await request(app).get(`/api/salons/${otherSalon.salon._id}`).set("Authorization", `Bearer ${token}`);

  expect(ownListedSalon.managerEmail).toBe(manager.email);
  expect(ownListedSalon.managerPhone).toBe(manager.phone);
  expect(otherListedSalon).not.toHaveProperty("managerEmail");
  expect(otherListedSalon).not.toHaveProperty("managerPhone");
  expect(ownDetailResponse.body.managerEmail).toBe(manager.email);
  expect(ownDetailResponse.body.managerPhone).toBe(manager.phone);
  expect(otherDetailResponse.body).not.toHaveProperty("managerEmail");
  expect(otherDetailResponse.body).not.toHaveProperty("managerPhone");
  expectPublicSalonFields(ownListedSalon, salon);
  expectPublicSalonFields(otherListedSalon, otherSalon.salon);
  expectPublicSalonFields(ownDetailResponse.body, salon);
  expectPublicSalonFields(otherDetailResponse.body, otherSalon.salon);
});

test("super-admin can view manager contacts", async () => {
  const { salon, manager } = await createSalonWithManager();
  const admin = await Admin.create({
    full_name: "Super Admin",
    username: "salon-contact-admin",
    email: "salon-contact-admin@example.com",
    password: await bcrypt.hash("Strong!Pass1", 12),
    role: "super-admin",
  });
  const token = generateToken(admin);

  const listResponse = await request(app).get("/api/salons").set("Authorization", `Bearer ${token}`);
  const listedSalon = listResponse.body.find((item) => item._id === String(salon._id));
  const detailResponse = await request(app).get(`/api/salons/${salon._id}`).set("Authorization", `Bearer ${token}`);

  expect(listedSalon.managerEmail).toBe(manager.email);
  expect(listedSalon.managerPhone).toBe(manager.phone);
  expect(detailResponse.body.managerEmail).toBe(manager.email);
  expect(detailResponse.body.managerPhone).toBe(manager.phone);
  expectPublicSalonFields(listedSalon, salon);
  expectPublicSalonFields(detailResponse.body, salon);
});

test("production salon creation does not log manager contact data", async () => {
  const admin = await Admin.create({
    full_name: "Salon Creation Admin",
    username: "salon-creation-admin",
    email: "salon-creation-admin@example.com",
    password: await bcrypt.hash("Strong!Pass1", 12),
    role: "super-admin",
  });
  const token = generateToken(admin);
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

  try {
    const response = await request(app)
      .post("/api/salons")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Quiet Salon",
        location: "20 Main Street",
        managerName: "Quiet Manager",
        managerEmail: "quiet-manager@gmail.com",
        managerPhone: "0777654321",
        managerPassword: "Strong!Pass1",
        open_time: "09:00",
        close_time: "18:00",
      });

    expect(response.status).toBe(201);
    expect(consoleLog).not.toHaveBeenCalled();
  } finally {
    consoleLog.mockRestore();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

test("production authorized salon detail includes contacts without logging them", async () => {
  const { salon, manager } = await createSalonWithManager();
  const token = generateToken(manager);
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

  try {
    const response = await request(app)
      .get(`/api/salons/${salon._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.managerEmail).toBe(manager.email);
    expect(response.body.managerPhone).toBe(manager.phone);
    expect(consoleLog).not.toHaveBeenCalled();
  } finally {
    consoleLog.mockRestore();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
