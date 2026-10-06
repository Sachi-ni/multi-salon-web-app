import request from "supertest";
import app from "./testApp.js";
import Customer from "../models/Customer.js";
import Admin from "../models/Admin.js";
import Appointment from "../models/Appointment.js";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import Service from "../models/Service.js";
import generateToken from "../utils/generateToken.js";

test("customer listing requires authentication and customer POST is absent", async () => {
  expect((await request(app).get("/api/customers")).status).toBe(401);
  expect((await request(app).post("/api/customers").send({ name: "Unsafe" })).status).toBe(404);
});

test("manager customer list is salon-scoped and omits credentials and reset fields", async () => {
  const salonA = await Salon.create({ name: "Manager Salon" });
  const salonB = await Salon.create({ name: "Other Salon" });
  const manager = await Staff.create({
    full_name: "Salon Manager", first_name: "Salon", last_name: "Manager",
    email: "customer-list-manager@example.com", password_hash: "unused", role: "manager", salon_id: salonA._id,
  });
  const staffA = await Staff.create({
    full_name: "Salon Staff", first_name: "Salon", last_name: "Staff",
    email: "customer-list-staff-a@example.com", password_hash: "unused", role: "staff", salon_id: salonA._id,
  });
  const staffB = await Staff.create({
    full_name: "Other Staff", first_name: "Other", last_name: "Staff",
    email: "customer-list-staff-b@example.com", password_hash: "unused", role: "staff", salon_id: salonB._id,
  });
  const bookedHere = await Customer.create({
    name: "Booked Here", email: "booked-here@example.com", phone: "0771111111", password_hash: "secret-hash",
    resetPasswordTokenHash: "legacy-reset-hash", resetPasswordExpires: new Date(),
    passwordResetOtpCodeHash: "otp-hash", passwordResetOtpExpires: new Date(),
    passwordResetOtpAttempts: 2, passwordResetOtpLastSentAt: new Date(), passwordResetSessionHash: "session-hash",
  });
  const preferredHere = await Customer.create({
    name: "Preferred Here", email: "preferred-here@example.com", password_hash: "secret-hash", preferredSalonId: salonA._id,
  });
  const bookedElsewhere = await Customer.create({
    name: "Booked Elsewhere", email: "booked-elsewhere@example.com", password_hash: "secret-hash",
  });

  const appointmentFields = {
    appointment_date: "2099-01-01", start_time: "10:00", end_time: "11:00", duration: 60,
  };
  await Appointment.create({ ...appointmentFields, customer_id: bookedHere._id, salon_id: salonA._id, staff_id: staffA._id });
  await Appointment.create({ ...appointmentFields, customer_id: bookedElsewhere._id, salon_id: salonB._id, staff_id: staffB._id });

  const response = await request(app)
    .get("/api/customers")
    .set("Authorization", `Bearer ${generateToken(manager)}`);

  expect(response.status).toBe(200);
  expect(response.body.map((customer) => customer.name).sort()).toEqual(["Booked Here", "Preferred Here"]);
  expect(response.body[0]).toMatchObject({ name: "Booked Here", email: "booked-here@example.com", phone: "0771111111" });
  for (const customer of response.body) {
    expect(customer).not.toHaveProperty("password_hash");
    expect(customer).not.toHaveProperty("resetPasswordTokenHash");
    expect(customer).not.toHaveProperty("passwordResetOtpCodeHash");
    expect(customer).not.toHaveProperty("passwordResetSessionHash");
    expect(customer).not.toHaveProperty("passwordResetOtpExpires");
  }
});

test("super-admin customer list remains cross-salon", async () => {
  const salonA = await Salon.create({ name: "Admin Salon A" });
  const salonB = await Salon.create({ name: "Admin Salon B" });
  const admin = await Admin.create({
    full_name: "Platform Admin", username: "customer-list-admin", email: "customer-list-admin@example.com",
    password: "unused", role: "super-admin",
  });
  const staffA = await Staff.create({
    full_name: "Admin Staff A", first_name: "Admin", last_name: "A",
    email: "customer-list-admin-staff-a@example.com", password_hash: "unused", role: "staff", salon_id: salonA._id,
  });
  const staffB = await Staff.create({
    full_name: "Admin Staff B", first_name: "Admin", last_name: "B",
    email: "customer-list-admin-staff-b@example.com", password_hash: "unused", role: "staff", salon_id: salonB._id,
  });
  const customerA = await Customer.create({ name: "Customer A", email: "customer-a@example.com", password_hash: "secret-a" });
  const customerB = await Customer.create({ name: "Customer B", email: "customer-b@example.com", password_hash: "secret-b" });
  const appointmentFields = {
    appointment_date: "2099-01-01", start_time: "10:00", end_time: "11:00", duration: 60,
  };
  await Appointment.create({ ...appointmentFields, customer_id: customerA._id, salon_id: salonA._id, staff_id: staffA._id });
  await Appointment.create({ ...appointmentFields, customer_id: customerB._id, salon_id: salonB._id, staff_id: staffB._id });

  const response = await request(app)
    .get("/api/customers")
    .set("Authorization", `Bearer ${generateToken(admin)}`);

  expect(response.status).toBe(200);
  expect(response.body.map((customer) => customer.name).sort()).toEqual(["Customer A", "Customer B"]);
  for (const customer of response.body) {
    expect(customer).not.toHaveProperty("password_hash");
    expect(customer).not.toHaveProperty("passwordResetOtpCodeHash");
    expect(customer).not.toHaveProperty("passwordResetSessionHash");
  }
});

test("preferred salon is saved but does not restrict booking another salon", async () => {
  const preferredSalon = await Salon.create({ name: "Preferred" });
  const bookingSalon = await Salon.create({ name: "Booking" });
  const staff = await Staff.create({ full_name: "Booking Staff", first_name: "Booking", last_name: "Staff", email: "booking-staff@example.com", password_hash: "unused", role: "staff", salon_id: bookingSalon._id });
  const service = await Service.create({ service_name: "Cut", base_price: 1000, duration: 60, salon_id: bookingSalon._id });
  const registration = await request(app).post("/api/auth/register").send({ fullName: "Customer", email: "booking-customer@example.com", phone: "0771234567", password: "Strong!Pass1", preferredSalonId: preferredSalon._id });
  expect(registration.status).toBe(201);
  const customer = await Customer.findOne({ email: "booking-customer@example.com" });
  expect(customer.preferredSalonId.toString()).toBe(preferredSalon._id.toString());

  const booking = await request(app).post("/api/appointments").set("Authorization", `Bearer ${generateToken(customer)}`).send({ salon_id: bookingSalon._id, service_id: service._id, staff_id: staff._id, appointment_date: "2099-01-01", start_time: "10:00" });
  expect(booking.status).toBe(201);
});
