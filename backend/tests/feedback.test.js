import request from "supertest";
import app from "./testApp.js";
import Appointment from "../models/Appointment.js";
import AppointmentService from "../models/AppointmentService.js";
import Customer from "../models/Customer.js";
import Feedback from "../models/Feedback.js";
import Salon from "../models/Salon.js";
import Service from "../models/Service.js";
import Staff from "../models/Staff.js";
import generateToken from "../utils/generateToken.js";

test("customer can rate every service and staff member in a completed appointment", async () => {
  const salon = await Salon.create({ name: "Feedback Salon" });
  const customer = await Customer.create({
    name: "Customer",
    email: "feedback-customer@gmail.com",
    password_hash: "unused",
  });
  const staffOne = await Staff.create({
    full_name: "Staff One",
    first_name: "Staff",
    last_name: "One",
    email: "feedback-staff-one@gmail.com",
    password_hash: "unused",
    role: "staff",
    salon_id: salon._id,
  });
  const staffTwo = await Staff.create({
    full_name: "Staff Two",
    first_name: "Staff",
    last_name: "Two",
    email: "feedback-staff-two@gmail.com",
    password_hash: "unused",
    role: "staff",
    salon_id: salon._id,
  });
  const serviceOne = await Service.create({
    service_name: "Cut",
    base_price: 30,
    duration: 30,
    salon_id: salon._id,
  });
  const serviceTwo = await Service.create({
    service_name: "Color",
    base_price: 50,
    duration: 45,
    salon_id: salon._id,
  });
  const appointment = await Appointment.create({
    customer_id: customer._id,
    salon_id: salon._id,
    service_id: serviceOne._id,
    service_ids: [serviceOne._id, serviceTwo._id],
    appointment_date: "2026-09-01",
    start_time: "10:00",
    end_time: "11:15",
    duration: 75,
    status: "completed",
  });
  await AppointmentService.create([
    {
      appointment_id: appointment._id,
      service_id: serviceOne._id,
      staff_id: staffOne._id,
      service_start_time: "10:00",
      service_end_time: "10:30",
    },
    {
      appointment_id: appointment._id,
      service_id: serviceTwo._id,
      staff_id: staffTwo._id,
      service_start_time: "10:30",
      service_end_time: "11:15",
    },
  ]);

  const response = await request(app)
    .post("/api/feedback")
    .set("Authorization", `Bearer ${generateToken(customer)}`)
    .send({
      appointment_id: appointment._id,
      serviceRatings: [
        { service_id: serviceOne._id, rating: 4 },
        { service_id: serviceTwo._id, rating: 5 },
      ],
      staffRatings: [
        { staff_id: staffOne._id, rating: 3 },
        { staff_id: staffTwo._id, rating: 5 },
      ],
      comment: "Great visit",
    });

  expect(response.status).toBe(201);
  expect(response.body.serviceRatings).toHaveLength(2);
  expect(response.body.staffRatings).toHaveLength(2);
  expect((await Appointment.findById(appointment._id)).feedback_submitted).toBe(true);

  const saved = await Feedback.findOne({ appointment_id: appointment._id });
  expect(saved.service_id.toString()).toBe(serviceOne._id.toString());
  expect(saved.staff_id.toString()).toBe(staffOne._id.toString());

  const serviceResponse = await request(app)
    .get("/api/services")
    .set("Authorization", `Bearer ${generateToken(customer)}`);
  const returnedServices = serviceResponse.body.filter((service) =>
    [serviceOne._id.toString(), serviceTwo._id.toString()].includes(service._id.toString())
  );
  expect(returnedServices.map((service) => service.rating)).toEqual([4, 5]);

  const staffResponse = await request(app)
    .get("/api/staff")
    .set("Authorization", `Bearer ${generateToken(customer)}`);
  const returnedStaff = staffResponse.body.filter((staff) =>
    [staffOne._id.toString(), staffTwo._id.toString()].includes(staff._id.toString())
  );
  expect(returnedStaff.map((staff) => staff.rating)).toEqual([3, 5]);
});
