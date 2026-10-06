import request from "supertest";
import app from "./testApp.js";
import Admin from "../models/Admin.js";
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import generateToken from "../utils/generateToken.js";
import { jest } from "@jest/globals";

const createStaff = (salonId, role, email) => Staff.create({
  full_name: role === "manager" ? "Salon Manager" : "Salon Staff",
  first_name: "Salon",
  last_name: role === "manager" ? "Manager" : "Staff",
  email,
  password_hash: "unused",
  role,
  salon_id: salonId,
});

const createFinalizedAppointment = (salonId, staffId) => Appointment.create({
  salon_id: salonId,
  staff_id: staffId,
  appointment_date: "2099-01-01",
  start_time: "10:00",
  end_time: "11:00",
  duration: 60,
  status: "completed",
});

test("production salon appointment list requests produce no console output", async () => {
  const salon = await Salon.create({ name: "Production Appointments Salon" });
  const manager = await createStaff(salon._id, "manager", "production-appointments-manager@example.com");
  const token = generateToken(manager);
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

  try {
    const response = await request(app)
      .get("/api/appointments")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(consoleLog).not.toHaveBeenCalled();
  } finally {
    consoleLog.mockRestore();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

test.each(["manager", "staff-admin"])("%s cannot delete a finalized appointment from another salon", async (role) => {
  const salonA = await Salon.create({ name: "Manager Salon" });
  const salonB = await Salon.create({ name: "Other Salon" });
  const manager = await createStaff(salonA._id, role, `delete-${role}-a@example.com`);
  const staffB = await createStaff(salonB._id, "staff", "delete-staff-b@example.com");
  const appointment = await createFinalizedAppointment(salonB._id, staffB._id);

  const response = await request(app)
    .delete(`/api/appointments/${appointment._id}`)
    .set("Authorization", `Bearer ${generateToken(manager)}`);

  expect(response.status).toBe(403);
  expect(await Appointment.exists({ _id: appointment._id })).toBeTruthy();
});

test("manager can delete a finalized appointment from their own salon", async () => {
  const salon = await Salon.create({ name: "Manager Salon" });
  const manager = await createStaff(salon._id, "manager", "delete-manager-own@example.com");
  const staff = await createStaff(salon._id, "staff", "delete-staff-own@example.com");
  const appointment = await createFinalizedAppointment(salon._id, staff._id);

  const response = await request(app)
    .delete(`/api/appointments/${appointment._id}`)
    .set("Authorization", `Bearer ${generateToken(manager)}`);

  expect(response.status).toBe(200);
  expect(await Appointment.exists({ _id: appointment._id })).toBeFalsy();
});

test("super-admin can delete a finalized appointment from any salon", async () => {
  const salon = await Salon.create({ name: "Any Salon" });
  const admin = await Admin.create({
    full_name: "Platform Admin",
    username: "delete-platform-admin",
    email: "delete-platform-admin@example.com",
    password: "unused",
    role: "super-admin",
  });
  const staff = await createStaff(salon._id, "staff", "delete-staff-superadmin@example.com");
  const appointment = await createFinalizedAppointment(salon._id, staff._id);

  const response = await request(app)
    .delete(`/api/appointments/${appointment._id}`)
    .set("Authorization", `Bearer ${generateToken(admin)}`);

  expect(response.status).toBe(200);
  expect(await Appointment.exists({ _id: appointment._id })).toBeFalsy();
});

test("customer can still delete their own finalized appointment", async () => {
  const salon = await Salon.create({ name: "Customer Salon" });
  const staff = await createStaff(salon._id, "staff", "delete-staff-customer@example.com");
  const customer = await Customer.create({
    name: "Appointment Customer",
    email: "delete-customer@example.com",
    password_hash: "unused",
  });
  const appointment = await createFinalizedAppointment(salon._id, staff._id);
  appointment.customer_id = customer._id;
  await appointment.save();

  const response = await request(app)
    .delete(`/api/appointments/${appointment._id}`)
    .set("Authorization", `Bearer ${generateToken(customer)}`);

  expect(response.status).toBe(200);
  expect(await Appointment.exists({ _id: appointment._id })).toBeFalsy();
});