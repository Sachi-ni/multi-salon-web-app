import request from "supertest";
import app from "./testApp.js";
import Staff from "../models/Staff.js";
import Salon from "../models/Salon.js";
import generateToken from "../utils/generateToken.js";
import Admin from "../models/Admin.js";
import Salary from "../models/Salary.js";
import Appointment from "../models/Appointment.js";
import { updateSalaryOnAppointmentCompletion } from "../controllers/salaryController.js";

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
  const createdStaff = await Staff.findOne({ email: "staff-d@gmail.com" });
  expect(createdStaff.salaryCalculationEnabled).toBe(true);
  expect(createdStaff.mustChangePassword).toBe(true);
  expect(await Salary.exists({ staff_id: createdStaff._id })).toBeTruthy();
});

test("new staff salary table shows today's per-day amount immediately", async () => {
  const salon = await Salon.create({ name: "Immediate Salary", staffCount: 0 });
  const manager = await Staff.create({ full_name: "Manager Immediate", first_name: "Manager", last_name: "Immediate", email: "manager-immediate@gmail.com", password_hash: "unused", role: "manager", salon_id: salon._id });

  const createResponse = await request(app)
    .post("/api/staff")
    .set("Authorization", `Bearer ${generateToken(manager)}`)
    .send(staffPayload("staff-immediate@gmail.com", {
      salaryPaymentFrequency: "daily",
      salaryPaymentCountPerDay: 125,
    }));

  expect(createResponse.status).toBe(201);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const salaryResponse = await request(app)
    .get(`/api/salary?frequency=daily&period=${todayKey}`)
    .set("Authorization", `Bearer ${generateToken(manager)}`);

  expect(salaryResponse.status).toBe(200);
  const salary = salaryResponse.body.salaries.find((row) => row.staff_id?.email === "staff-immediate@gmail.com");
  expect(salary.totalSalary).toBe(125);
  expect(salary.daySalary).toBe(125);
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

test("super-admin can make a manually-set replacement password temporary", async () => {
  const salon = await Salon.create({ name: "Password reset salon", staffCount: 0 });
  const admin = await Admin.create({ full_name: "Super", username: "super-reset", email: "super-reset@gmail.com", password: "unused", role: "super-admin" });
  const staff = await Staff.create({
    full_name: "Staff Reset", first_name: "Staff", last_name: "Reset", email: "staff-reset-force@gmail.com",
    password_hash: "unused", role: "staff", salon_id: salon._id, mustChangePassword: false,
  });

  const response = await request(app)
    .put(`/api/staff/${staff._id}`)
    .set("Authorization", `Bearer ${generateToken(admin)}`)
    .send({ password: "Replacement!Pass1", forcePasswordChange: "true" });

  expect(response.status).toBe(200);
  const updated = await Staff.findById(staff._id);
  expect(updated.mustChangePassword).toBe(true);
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

test("changing frequency closes the old salary and opens the new salary from today", async () => {
  const salon = await Salon.create({ name: "A", staffCount: 0 });
  const manager = await Staff.create({ full_name: "Manager A", first_name: "Manager", last_name: "A", email: "manager-frequency@gmail.com", password_hash: "unused", role: "manager", salon_id: salon._id });
  const staff = await Staff.create({ full_name: "Staff Frequency", first_name: "Staff", last_name: "Frequency", email: "staff-frequency@gmail.com", password_hash: "unused", role: "staff", salon_id: salon._id, salary_payment_frequency: "daily" });
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  await Salary.create({
    salon_id: salon._id,
    staff_id: staff._id,
    frequency: "daily",
    period: dateKey,
    staff_name: staff.full_name,
    dateRange: { start: dateKey, end: dateKey },
    workingAmount: 1000,
    rate: 10,
    workRate: 100,
    daySalary: 100,
    totalSalary: 100,
    status: "Not Paid",
  });

  const response = await request(app)
    .put(`/api/staff/${staff._id}`)
    .set("Authorization", `Bearer ${generateToken(manager)}`)
    .send({ salaryPaymentFrequency: "weekly" });

  expect(response.status).toBe(200);
  const oldSalary = await Salary.findOne({ staff_id: staff._id, frequency: "daily" });
  const newSalary = await Salary.findOne({ staff_id: staff._id, frequency: "weekly" });
  expect(oldSalary.isTransitioned).toBe(true);
  expect(oldSalary.status).toBe("Paid");
  expect(oldSalary.totalSalary).toBe(100);
  expect(oldSalary.daySalary).toBe(100);
  expect(oldSalary.paidTotal).toBe(100);
  expect(newSalary.dateRange.start).toBe(tomorrowKey);
  expect(newSalary.calculationStartDate).toBe(tomorrowKey);
  expect(newSalary.totalSalary).toBe(0);
  expect(response.body.salaryTransition.salaryId).toBe(String(oldSalary._id));
});

test("editing daily salary preserves working amount and recalculates the active total", async () => {
  const salon = await Salon.create({ name: "Daily Edit", staffCount: 0 });
  const manager = await Staff.create({ full_name: "Manager Daily", first_name: "Manager", last_name: "Daily", email: "manager-daily-edit@gmail.com", password_hash: "unused", role: "manager", salon_id: salon._id });
  const staff = await Staff.create({
    full_name: "Staff Daily",
    first_name: "Staff",
    last_name: "Daily",
    email: "staff-daily-edit@gmail.com",
    password_hash: "unused",
    role: "staff",
    salon_id: salon._id,
    salary_payment_frequency: "monthly",
    salary_payment_count_per_day: 50,
  });
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const monthKey = todayKey.slice(0, 7);

  const salary = await Salary.create({
    salon_id: salon._id,
    staff_id: staff._id,
    employmentStartDate: todayKey,
    frequency: "monthly",
    period: monthKey,
    salary_payment_count_per_day: 50,
    dateRange: { start: todayKey, end: todayKey },
    dailyRecords: [{
      date: todayKey,
      workingAmount: 1000,
      rate: 10,
      workRate: 100,
      daySalary: 100,
      totalSalary: 100,
    }],
    workingAmount: 1000,
    workRate: 100,
    daySalary: 100,
    totalSalary: 100,
    status: "Not Paid",
  });

  const response = await request(app)
    .put(`/api/staff/${staff._id}`)
    .set("Authorization", `Bearer ${generateToken(manager)}`)
    .send({ salaryPaymentCountPerDay: 200 });

  expect(response.status).toBe(200);
  const updatedSalary = await Salary.findById(salary._id);
  expect(updatedSalary._id.toString()).toBe(salary._id.toString());
  expect(updatedSalary.workingAmount).toBe(1000);
  expect(updatedSalary.totalSalary).toBe(200);
  expect(updatedSalary.dailyRecords[0].workingAmount).toBe(1000);
  expect(updatedSalary.dailyRecords[0].daySalary).toBe(200);
});

test.each(["staff", "manager"])("newly added %s earns only from its added date", async (role) => {
  const salon = await Salon.create({ name: `Salary ${role}`, staffCount: 0 });
  const staff = await Staff.create({
    full_name: `New ${role}`,
    first_name: "New",
    last_name: role,
    email: `new-${role}-salary@gmail.com`,
    password_hash: "unused",
    role,
    salon_id: salon._id,
    commission_rate: 10,
    salary_payment_frequency: "monthly",
    salary_payment_count_per_day: 1,
  });
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  await Salary.create({
    salon_id: salon._id,
    staff_id: staff._id,
    frequency: "monthly",
    period: monthKey,
    staff_name: staff.full_name,
    dateRange: {
      start: `${monthKey}-01`,
      end: `${monthKey}-${String(monthEnd).padStart(2, "0")}`,
    },
    dailyRecords: [{
      date: `${monthKey}-01`,
      workingAmount: 500,
      rate: 10,
      workRate: 50,
      daySalary: 50,
      totalSalary: 50,
    }],
  });

  const appointment = await Appointment.create({
    salon_id: salon._id,
    staff_id: staff._id,
    appointment_date: todayKey,
    start_time: "10:00",
    end_time: "11:00",
    duration: 60,
    total_price: 100,
    status: "completed",
  });

  await updateSalaryOnAppointmentCompletion(appointment._id);

  const salary = await Salary.findOne({ staff_id: staff._id, period: monthKey, frequency: "monthly" });
  const previousDay = salary.dailyRecords.find((record) => record.date === `${monthKey}-01`);
  const currentDay = salary.dailyRecords.find((record) => record.date === todayKey);

  expect(salary.employmentStartDate).toBe(todayKey);
  expect(previousDay.workingAmount).toBe(0);
  expect(previousDay.daySalary).toBe(0);
  expect(previousDay.totalSalary).toBe(0);
  expect(currentDay.workingAmount).toBe(100);
  expect(currentDay.daySalary).toBe(10);
  expect(salary.totalSalary).toBe(10);
});

test("newly added manager gets a salary record with the per-day amount", async () => {
  const admin = await Admin.create({ full_name: "Super", username: "manager-salary-super", email: "manager-salary-super@gmail.com", password: "unused", role: "super-admin" });

  const response = await request(app)
    .post("/api/salons")
    .set("Authorization", `Bearer ${generateToken(admin)}`)
    .send({
      name: "Manager Salary",
      managerName: "New Manager",
      managerEmail: "new-manager-salary@gmail.com",
      managerPhone: "0771234567",
      managerPassword: "Strong!Pass1",
    });

  expect(response.status).toBe(201);
  const manager = await Staff.findOne({ email: "new-manager-salary@gmail.com" });
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const salary = await Salary.findOne({ staff_id: manager._id, frequency: "monthly", period: monthKey });

  expect(salary).toBeTruthy();
  expect(salary.totalSalary).toBe(0);

  const appointment = await Appointment.create({
    salon_id: manager.salon_id,
    staff_id: manager._id,
    appointment_date: todayKey,
    start_time: "10:00",
    end_time: "11:00",
    duration: 60,
    total_price: 100,
    status: "completed",
  });

  await updateSalaryOnAppointmentCompletion(appointment._id);
  const updatedSalary = await Salary.findById(salary._id);
  expect(updatedSalary.workingAmount).toBe(100);
  expect(updatedSalary.totalSalary).toBe(1);
});
