import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Models
import Salon from "./models/Salon.js";
import ServiceCategory from "./models/ServiceCategory.js";
import Service from "./models/Service.js";
import Staff from "./models/Staff.js";
import StaffAvailability from "./models/StaffAvailability.js";
import Customer from "./models/Customer.js";
import Appointment from "./models/Appointment.js";
import Admin from "./models/Admin.js";
import Bill from "./models/Bill.js";
import Review from "./models/Review.js";
import AppointmentService from "./models/AppointmentService.js";

dotenv.config();

// Helper to add hours to a "HH:MM" string
const addHours = (timeStr, hours) => {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMinutes = h * 60 + m + hours * 60;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
};

const seed = async () => {
  try {
    console.log("Connecting to database...");
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined in .env file");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    console.log("Clearing existing data...");
    await Salon.deleteMany({});
    await ServiceCategory.deleteMany({});
    await Service.deleteMany({});
    await Staff.deleteMany({});
    await StaffAvailability.deleteMany({});
    await Customer.deleteMany({});
    await Appointment.deleteMany({});
    await Admin.deleteMany({});
    await Bill.deleteMany({});
    await Review.deleteMany({});
    await AppointmentService.deleteMany({});
    console.log("Database cleared.");

    // Generate password hash
    console.log("Generating common password hash for testing ('123456')...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("123456", salt);
    console.log("Password hash generated.");

    // 1. Service Categories
    console.log("Creating service categories...");
    const categories = await ServiceCategory.insertMany([
      { category_name: "Hair" },
      { category_name: "Beauty" },
      { category_name: "Spa" },
      { category_name: "Makeup" }
    ]);
    console.log(`Created ${categories.length} categories.`);

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.category_name] = cat._id;
    });

    // 2. Salons
    console.log("Creating salons...");
    const salons = await Salon.insertMany([
      {
        name: "Colombo Branch",
        ownerName: "Admin Colombo",
        location: "Colombo, Sri Lanka",
        contact_info: "No. 12, Galle Road, Colombo 03",
        phone: "0112345678",
        email: "colombo@salon.com",
        open_time: "09:00",
        close_time: "17:00",
        capacity: 5,
        about: "Our flagship salon in Colombo offers premium hair, beauty, and spa services with state-of-the-art facilities."
      },
      {
        name: "Negombo Branch",
        ownerName: "Admin Negombo",
        location: "Negombo, Sri Lanka",
        contact_info: "No. 45, Lewis Place, Negombo",
        phone: "0312345678",
        email: "negombo@salon.com",
        open_time: "09:00",
        close_time: "17:00",
        capacity: 5,
        about: "Conveniently located near the beach, our Negombo branch offers top-tier hair styling and facial treatments."
      },
      {
        name: "Jaffna Branch",
        ownerName: "Admin Jaffna",
        location: "Jaffna, Sri Lanka",
        contact_info: "No. 88, Hospital Road, Jaffna",
        phone: "0212345678",
        email: "jaffna@salon.com",
        open_time: "09:00",
        close_time: "17:00",
        capacity: 5,
        about: "Our Jaffna branch provides specialized bridal makeup, traditional styling, and relaxing spa sessions."
      }
    ]);
    console.log(`Created ${salons.length} salons.`);

    // 3. Admins (Super admin + Branch admins)
    console.log("Creating Admins for system testing...");
    await Admin.insertMany([
      {
        full_name: "Super Admin",
        username: "superadmin",
        email: "pawanmadushanka15@gmail.com",
        phone: "0771112222",
        password: passwordHash,
        role: "super-admin",
        salon_id: null
      },
      {
        full_name: "Colombo Admin",
        username: "colomboadmin",
        email: "colomboadmin@salon.com",
        phone: "0773334444",
        password: passwordHash,
        role: "staff-admin",
        salon_id: salons[0]._id
      },
      {
        full_name: "Negombo Admin",
        username: "negomboadmin",
        email: "negomboadmin@salon.com",
        phone: "0775556666",
        password: passwordHash,
        role: "staff-admin",
        salon_id: salons[1]._id
      },
      {
        full_name: "Jaffna Admin",
        username: "jaffnaadmin",
        email: "jaffnaadmin@salon.com",
        phone: "0777778888",
        password: passwordHash,
        role: "staff-admin",
        salon_id: salons[2]._id
      }
    ]);
    console.log("Admins seeded.");

    // 4. Services (Templates mapped to all 3 salons, creating distinct service records per salon)
    console.log("Creating services for each salon...");
    const serviceTemplates = [
      { service_name: "Hair Cut", description: "Classic trim, wash, and style.", duration: 60, base_price: 1500, categoryName: "Hair" },
      { service_name: "Hair Coloring", description: "Full head color using premium organic dyes.", duration: 120, base_price: 5000, categoryName: "Hair" },
      { service_name: "Hair Wash", description: "Deep cleanse wash and blow dry.", duration: 60, base_price: 1000, categoryName: "Hair" },
      { service_name: "Beard Trim", description: "Precision beard shaping and conditioning.", duration: 60, base_price: 800, categoryName: "Hair" },
      { service_name: "Facial", description: "Revitalizing skin treatment and scrub.", duration: 120, base_price: 3000, categoryName: "Beauty" },
      { service_name: "Bridal Makeup", description: "Exquisite bridal makeovers including hairstyling.", duration: 180, base_price: 15000, categoryName: "Makeup" },
      { service_name: "Threading", description: "Precise eyebrow and facial threading.", duration: 60, base_price: 500, categoryName: "Beauty" },
      { service_name: "Spa Treatment", description: "Full body Swedish massage and aromatherapy.", duration: 120, base_price: 6000, categoryName: "Spa" },
      { service_name: "Hair Straightening", description: "Keratin-infused straightening treatment.", duration: 180, base_price: 8000, categoryName: "Hair" },
      { service_name: "Hair Treatment", description: "Deep conditioning spa treatment to repair damaged hair.", duration: 120, base_price: 4000, categoryName: "Hair" }
    ];

    const allServices = [];
    for (const salon of salons) {
      for (const t of serviceTemplates) {
        const s = await Service.create({
          service_name: t.service_name,
          description: t.description,
          duration: t.duration,
          base_price: t.base_price,
          category_id: categoryMap[t.categoryName],
          salon_id: salon._id
        });
        allServices.push(s);
      }
    }
    console.log(`Created ${allServices.length} total services.`);

    // 5. Staff Members (5 per salon = 15 total)
    console.log("Creating staff members and assigning services based on specialization...");
    const staffTemplates = [
      // Colombo Staff (Index 0)
      { full_name: "Kasun Perera", role: "Stylist", specification: "Hair Stylist", salonIndex: 0 },
      { full_name: "Dilshan Fernando", role: "Senior Stylist", specification: "Master Hair Specialist", salonIndex: 0 },
      { full_name: "Priyanthi Silva", role: "Beautician", specification: "Skin Care Expert", salonIndex: 0 },
      { full_name: "Sanduni Jayasinghe", role: "Spa Specialist", specification: "Massage Therapist", salonIndex: 0 },
      { full_name: "Amara Wijesinghe", role: "Makeup Artist", specification: "Bridal Makeup Artist", salonIndex: 0 },

      // Negombo Staff (Index 1)
      { full_name: "Sheron Cooray", role: "Stylist", specification: "Hair Stylist", salonIndex: 1 },
      { full_name: "Nisal Mendis", role: "Senior Stylist", specification: "Hair Coloring Expert", salonIndex: 1 },
      { full_name: "Fathima Rizan", role: "Beautician", specification: "Esthetician", salonIndex: 1 },
      { full_name: "Nadeesha Perera", role: "Spa Specialist", specification: "Spa Therapist", salonIndex: 1 },
      { full_name: "Kavindi Jayawardena", role: "Makeup Artist", specification: "Fashion Makeup Artist", salonIndex: 1 },

      // Jaffna Staff (Index 2)
      { full_name: "Sinthujan Selvarajah", role: "Stylist", specification: "Hair Stylist", salonIndex: 2 },
      { full_name: "Tharshini Koneswaran", role: "Senior Stylist", specification: "Hair Care Specialist", salonIndex: 2 },
      { full_name: "Abirami Visvanathan", role: "Beautician", specification: "Beauty Therapist", salonIndex: 2 },
      { full_name: "Luxman Balakrishnan", role: "Spa Specialist", specification: "Body Therapy Specialist", salonIndex: 2 },
      { full_name: "Janaki Ramachandran", role: "Makeup Artist", specification: "Traditional Bridal Artist", salonIndex: 2 }
    ];

    const allStaff = [];
    for (const t of staffTemplates) {
      const salon = salons[t.salonIndex];
      // Get services of this salon
      const salonServices = allServices.filter(s => s.salon_id.equals(salon._id));
      
      // Determine which services this staff can do based on role
      let staffServices = [];
      if (t.role === "Stylist" || t.role === "Senior Stylist") {
        staffServices = salonServices.filter(s => s.category_id.equals(categoryMap["Hair"]));
      } else if (t.role === "Beautician") {
        staffServices = salonServices.filter(s => s.category_id.equals(categoryMap["Beauty"]));
      } else if (t.role === "Spa Specialist") {
        staffServices = salonServices.filter(s => s.category_id.equals(categoryMap["Spa"]));
      } else if (t.role === "Makeup Artist") {
        staffServices = salonServices.filter(s => s.category_id.equals(categoryMap["Makeup"]));
      }

      const staffMember = await Staff.create({
        full_name: t.full_name,
        phone: `077${Math.floor(1000000 + Math.random() * 9000000)}`,
        email: `${t.full_name.toLowerCase().replace(/\s+/g, "")}@salon.com`,
        role: t.role,
        specification: t.specification,
        commission_rate: t.role.includes("Senior") ? 15 : 10,
        status: "Active",
        salon_id: salon._id,
        image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(t.full_name)}`,
        services: staffServices.map(s => s._id)
      });
      allStaff.push(staffMember);
    }
    console.log(`Created ${allStaff.length} staff members.`);

    // Update staff count on salons
    for (const salon of salons) {
      const count = allStaff.filter(st => st.salon_id.equals(salon._id)).length;
      salon.staffCount = count;
      await salon.save();
    }
    console.log("Updated staff counts for all salons.");

    // 6. Availability records for next 30 days
    console.log("Generating 30 days of staff availability schedules (09:00 - 17:00)...");
    const availabilityDocs = [];
    const slotTemplates = [
      { start_time: "09:00", end_time: "10:00" },
      { start_time: "10:00", end_time: "11:00" },
      { start_time: "11:00", end_time: "12:00" },
      { start_time: "12:00", end_time: "13:00" },
      { start_time: "13:00", end_time: "14:00" },
      { start_time: "14:00", end_time: "15:00" },
      { start_time: "15:00", end_time: "16:00" },
      { start_time: "16:00", end_time: "17:00" }
    ];

    for (const staff of allStaff) {
      for (let day = 0; day < 30; day++) {
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + day);
        dateObj.setHours(0, 0, 0, 0);

        availabilityDocs.push({
          staff_id: staff._id,
          available_date: dateObj,
          slots: slotTemplates.map(slot => ({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_booked: false
          }))
        });
      }
    }
    await StaffAvailability.insertMany(availabilityDocs);
    console.log(`Generated ${availabilityDocs.length} availability records.`);

    // 7. Customers (20 sample customers)
    console.log("Creating sample customers...");
    const customerNames = [
      "Ruwan Gamage", "Nipuni Perera", "Thisara Silva", "Sachini Fernando", 
      "Dinuka Herath", "Eranga Bandara", "Kavisha Ranasinghe", "Madhusha Jayawardena", 
      "Roshan Gunawardena", "Minoli Peiris", "Thilina Ratnayake", "Pathum Nissanka", 
      "Oshadi Ranasinghe", "Nilanthi Cooray", "Chathura de Silva", "Isuru Udana", 
      "Hashini Samarakoon", "Devinda Perera", "Nadeesha Hemamali", "Duminda Silva"
    ];

    const customersData = customerNames.map((name, i) => {
      const email = `${name.toLowerCase().replace(/\s+/g, "")}@example.com`;
      const phone = `07712345${String(i).padStart(2, "0")}`;
      const regDate = new Date();
      regDate.setDate(regDate.getDate() - (i + 1) * 3); // Registered in the past

      return {
        name,
        phone,
        email,
        registration_date: regDate,
        password_hash: passwordHash,
        role: "customer"
      };
    });

    const customers = await Customer.insertMany(customersData);
    console.log(`Created ${customers.length} sample customers.`);

    // 8. Sample Appointments
    console.log("Generating sample appointments and locking corresponding availability slots...");
    
    // Helper to offset date from today
    const getFormattedDate = (offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.toISOString().split("T")[0];
    };

    const tomorrow = getFormattedDate(1);
    const dayAfter = getFormattedDate(2);
    const dayThree = getFormattedDate(3);

    // Helpers to find specific items
    const findService = (salonId, name) => allServices.find(s => s.salon_id.equals(salonId) && s.service_name === name);
    const findStaff = (salonId, name) => allStaff.find(s => s.salon_id.equals(salonId) && s.full_name === name);

    // Appointment specifications
    const appointmentSpecs = [
      // 1. Confirmed booking tomorrow for Kasun Perera (Colombo) - 1 hour service (10:00 - 11:00)
      {
        salon: salons[0],
        customer: customers[0],
        staffName: "Kasun Perera",
        serviceName: "Hair Cut",
        date: tomorrow,
        start_time: "10:00",
        status: "confirmed"
      },
      // 2. Confirmed booking tomorrow for Kasun Perera (Colombo) - 2 hour service (13:00 - 15:00)
      {
        salon: salons[0],
        customer: customers[1],
        staffName: "Kasun Perera",
        serviceName: "Hair Coloring",
        date: tomorrow,
        start_time: "13:00",
        status: "confirmed"
      },
      // 3. Confirmed booking tomorrow for Dilshan Fernando (Colombo) - 3 hour service (09:00 - 12:00)
      {
        salon: salons[0],
        customer: customers[2],
        staffName: "Dilshan Fernando",
        serviceName: "Hair Straightening",
        date: tomorrow,
        start_time: "09:00",
        status: "confirmed"
      },
      // 4. Pending booking tomorrow for Priyanthi Silva (Colombo) - 2 hour service (14:00 - 16:00)
      {
        salon: salons[0],
        customer: customers[3],
        staffName: "Priyanthi Silva",
        serviceName: "Facial",
        date: tomorrow,
        start_time: "14:00",
        status: "pending"
      },
      // 5. Completed booking dayAfter for Sheron Cooray (Negombo) - 1 hour service (09:00 - 10:00)
      {
        salon: salons[1],
        customer: customers[4],
        staffName: "Sheron Cooray",
        serviceName: "Hair Wash",
        date: dayAfter,
        start_time: "09:00",
        status: "completed"
      },
      // 6. Cancelled booking dayAfter for Sheron Cooray (Negombo) - 1 hour service (10:00 - 11:00)
      {
        salon: salons[1],
        customer: customers[5],
        staffName: "Sheron Cooray",
        serviceName: "Beard Trim",
        date: dayAfter,
        start_time: "10:00",
        status: "cancelled"
      },
      // 7. Confirmed booking tomorrow for Janaki Ramachandran (Jaffna) - 3 hour service (10:00 - 13:00)
      {
        salon: salons[2],
        customer: customers[6],
        staffName: "Janaki Ramachandran",
        serviceName: "Bridal Makeup",
        date: tomorrow,
        start_time: "10:00",
        status: "confirmed"
      },
      // 8. Rejected booking dayThree for Abirami Visvanathan (Jaffna) - 1 hour service (11:00 - 12:00)
      {
        salon: salons[2],
        customer: customers[7],
        staffName: "Abirami Visvanathan",
        serviceName: "Threading",
        date: dayThree,
        start_time: "11:00",
        status: "rejected"
      }
    ];

    for (const spec of appointmentSpecs) {
      const salon = spec.salon;
      const customer = spec.customer;
      const staff = findStaff(salon._id, spec.staffName);
      const service = findService(salon._id, spec.serviceName);

      if (!staff || !service) {
        console.warn(`Could not find staff ${spec.staffName} or service ${spec.serviceName} for ${salon.name}`);
        continue;
      }

      const duration = service.duration;
      const durationHours = Math.ceil(duration / 60);
      const end_time = addHours(spec.start_time, durationHours);

      // Create the Appointment record
      const app = await Appointment.create({
        customer_id: customer._id,
        salon_id: salon._id,
        service_id: service._id,
        staff_id: staff._id,
        appointment_date: spec.date,
        start_time: spec.start_time,
        end_time: end_time,
        duration: duration,
        status: spec.status,
        total_price: service.base_price,
        notes: `Sample ${spec.status} booking for testing.`,
        confirmed_at: spec.status === "confirmed" || spec.status === "completed" ? new Date() : null,
        rejected_at: spec.status === "rejected" ? new Date() : null,
        cancelled_at: spec.status === "cancelled" ? new Date() : null
      });

      // If confirmed or completed, book the slots in StaffAvailability
      if (spec.status === "confirmed" || spec.status === "completed") {
        const queryDate = new Date(spec.date);
        queryDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Calculate slots to mark
        const slotStartTimes = [];
        let [h, m] = spec.start_time.split(":").map(Number);
        for (let i = 0; i < durationHours; i++) {
          slotStartTimes.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
          h++;
        }

        for (const startTime of slotStartTimes) {
          await StaffAvailability.updateOne(
            {
              staff_id: staff._id,
              available_date: { $gte: queryDate, $lt: nextDay },
              "slots.start_time": startTime
            },
            { $set: { "slots.$.is_booked": true } }
          );
        }
      }
    }
    console.log("Appointments seeded and slot availability updated successfully.");

    console.log("Seeding process completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  }
};

seed();
