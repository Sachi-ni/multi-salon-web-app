import request from "supertest";
import app from "./testApp.js";
import Staff from "../models/Staff.js";
import Salon from "../models/Salon.js";
import generateToken from "../utils/generateToken.js";
import Admin from "../models/Admin.js";

const staffPayload = (email, extra = {}) => ({ name: "New Staff Member", firstName: "New", lastName: "Staff", email, phone: "0771234567", password: "Strong!Pass1", ...extra });

const makeSalons = async () => ({ salonA: await Salon.create({ name: "A", staffCount: 0 }), salonB: await Salon.create({ name: "B", staffCount: 0 }) });

test("manager cannot move created staff to another salon", async () => {
  const { salonA, salonB } = await makeSalons();
  const manager = await Staff.create({ full_name: "Manager A", first_name: "Manager", last_name: "A", email: "manager-a@gmail.com", password_hash: "unused", role: "manager", salon_id: salonA._id });
  const response = await request(app).post("/api/staff").set("Authorization", `Bearer ${generateToken(manager)}`).send(staffPayload("staff-a@gmail.com", { salonId: salonB._id }));
  expect(response.status).toBe(201);
  expect((await Staff.findOne({ email: "staff-a@gmail.com" })).salon_id.toString()).toBe(salonA._id.toString());
});

test("manager cannot create a privileged staff role", async () => {
  const salon = await Salon.create({ name: "A", staffCount: 0 });
  const manager = await Staff.create({ full_name: "Manager A", first_name: "Manager", last_name: "A", email: "manager-b@gmail.com", password_hash: "unused", role: "manager", salon_id: salon._id });
  const response = await request(app).post("/api/staff").set("Authorization", `Bearer ${generateToken(manager)}`).send(staffPayload("staff-b@gmail.com", { role: "super-admin" }));
  expect(response.status).toBe(400);
  expect(await Staff.exists({ email: "staff-b@gmail.com" })).toBeFalsy();
});

test("super-admin cannot create staff for an unknown salon", async () => {
  const admin = await Admin.create({ full_name: "Super", username: "super", email: "super@gmail.com", password: "unused", role: "super-admin" });
  const response = await request(app).post("/api/staff").set("Authorization", `Bearer ${generateToken(admin)}`).send(staffPayload("staff-c@gmail.com", { salonId: "507f1f77bcf86cd799439011" }));
  expect(response.status).toBe(404);
});

test("manager staff creation increments the effective salon count", async () => {
  const salon = await Salon.create({ name: "A", staffCount: 0 });
  const manager = await Staff.create({ full_name: "Manager A", first_name: "Manager", last_name: "A", email: "manager-c@gmail.com", password_hash: "unused", role: "manager", salon_id: salon._id });
  const response = await request(app).post("/api/staff").set("Authorization", `Bearer ${generateToken(manager)}`).send(staffPayload("staff-d@gmail.com"));
  expect(response.status).toBe(201);
  expect((await Salon.findById(salon._id)).staffCount).toBe(1);
});

test("super-admin cannot update staff to an unknown salon", async () => {
  const salon = await Salon.create({ name: "A", staffCount: 0 });
  const admin = await Admin.create({ full_name: "Super", username: "super-update", email: "super-update@gmail.com", password: "unused", role: "super-admin" });
  const staff = await Staff.create({ full_name: "Staff A", first_name: "Staff", last_name: "A", email: "staff-update-a@gmail.com", password_hash: "unused", role: "staff", salon_id: salon._id });

  const response = await request(app)
    .put(`/api/staff/${staff._id}`)
    .set("Authorization", `Bearer ${generateToken(admin)}`)
    .send({ salonId: "507f1f77bcf86cd799439011" });

  expect(response.status).toBe(404);
  expect((await Staff.findById(staff._id)).salon_id.toString()).toBe(salon._id.toString());
});

test("manager cannot reassign staff to another salon", async () => {
  const { salonA, salonB } = await makeSalons();
  const manager = await Staff.create({ full_name: "Manager A", first_name: "Manager", last_name: "A", email: "manager-update@gmail.com", password_hash: "unused", role: "manager", salon_id: salonA._id });
  const staff = await Staff.create({ full_name: "Staff B", first_name: "Staff", last_name: "B", email: "staff-update-b@gmail.com", password_hash: "unused", role: "staff", salon_id: salonA._id });

  const response = await request(app)
    .put(`/api/staff/${staff._id}`)
    .set("Authorization", `Bearer ${generateToken(manager)}`)
    .send({ salonId: salonB._id });

  expect([200, 403]).toContain(response.status);
  expect((await Staff.findById(staff._id)).salon_id.toString()).toBe(salonA._id.toString());
});
