import request from "supertest";
import app from "./testApp.js";
import Admin from "../models/Admin.js";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import Appointment from "../models/Appointment.js";
import Bill from "../models/Bill.js";
import generateToken from "../utils/generateToken.js";

const dateKey = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

test("revenue and staff metrics use isolated controlled records", async () => {
  const admin = await Admin.create({
    full_name: "Revenue Admin",
    username: "revenue-admin",
    email: "revenue-admin@gmail.com",
    password: "unused",
    role: "super-admin",
  });
  const salonA = await Salon.create({ name: "Revenue A" });
  const salonB = await Salon.create({ name: "Revenue B" });
  const staffA = await Staff.create({
    full_name: "Revenue Staff A",
    first_name: "Revenue",
    last_name: "A",
    email: "revenue-staff-a@gmail.com",
    password_hash: "unused",
    role: "staff",
    salon_id: salonA._id,
  });
  const staffB = await Staff.create({
    full_name: "Revenue Staff B",
    first_name: "Revenue",
    last_name: "B",
    email: "revenue-staff-b@gmail.com",
    password_hash: "unused",
    role: "staff",
    salon_id: salonB._id,
  });

  const appointments = await Appointment.create([
    { salon_id: salonA._id, staff_id: staffA._id, appointment_date: dateKey(), start_time: "10:00", end_time: "11:00", duration: 60, total_price: 1000, status: "completed" },
    { salon_id: salonA._id, staff_id: staffA._id, appointment_date: dateKey(), start_time: "11:00", end_time: "12:00", duration: 60, total_price: 2000, status: "completed" },
    { salon_id: salonB._id, staff_id: staffB._id, appointment_date: dateKey(), start_time: "10:00", end_time: "11:00", duration: 60, total_price: 3000, status: "completed" },
  ]);

  await Bill.create([
    { appointment_id: appointments[0]._id, salon_id: salonA._id, bill_number: "REV-TEST-001", total_amount: 1000, bill_date: new Date(), payment_status: "paid" },
    { appointment_id: appointments[1]._id, salon_id: salonA._id, bill_number: "REV-TEST-002", total_amount: 2000, bill_date: new Date(), payment_status: "paid" },
    { appointment_id: appointments[2]._id, salon_id: salonB._id, bill_number: "REV-TEST-003", total_amount: 3000, bill_date: new Date(), payment_status: "paid" },
  ]);

  const authorization = { Authorization: `Bearer ${generateToken(admin)}` };
  const stats = await request(app).get("/api/revenue/stats?period=30days").set(authorization);
  const salons = await request(app).get("/api/revenue/salons?period=30days").set(authorization);
  const monthly = await request(app).get("/api/revenue/monthly").set(authorization);
  const staff = await request(app).get("/api/revenue/staff?period=30days").set(authorization);

  expect(stats.status).toBe(200);
  expect(stats.body.grossRevenue).toBe(6000);
  expect(salons.status).toBe(200);
  expect(salons.body.find((row) => row.name === "Revenue A").revenue).toBe(3000);
  expect(salons.body.find((row) => row.name === "Revenue B").revenue).toBe(3000);
  expect(monthly.status).toBe(200);
  expect(monthly.body.total).toBe(6000);
  expect(staff.status).toBe(200);
  expect(staff.body.find((row) => row.name === "Revenue Staff A")).toMatchObject({
    totalBookings: 2,
    completedBookings: 2,
    revenue: 3000,
  });
  expect(staff.body.find((row) => row.name === "Revenue Staff B")).toMatchObject({
    totalBookings: 1,
    completedBookings: 1,
    revenue: 3000,
  });
});
