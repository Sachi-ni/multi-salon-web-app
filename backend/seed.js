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
import Feedback from "./models/Feedback.js";
import Notification from "./models/Notification.js";
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
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_salon_db";
    await mongoose.connect(mongoUri);
    console.log("Connected successfully to MongoDB!");

    console.log("Clearing existing data...");
    await Promise.all([
      Salon.deleteMany({}),
      ServiceCategory.deleteMany({}),
      Service.deleteMany({}),
      Staff.deleteMany({}),
      StaffAvailability.deleteMany({}),
      Customer.deleteMany({}),
      Appointment.deleteMany({}),
      Admin.deleteMany({}),
      Bill.deleteMany({}),
      Review.deleteMany({}),
      Feedback.deleteMany({}),
      Notification.deleteMany({}),
      AppointmentService.deleteMany({})
    ]);
    console.log("Database cleared.");

    // Generate password hash
    console.log("Generating common password hash for testing ('123456')...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("123456", salt);
    console.log("Password hash generated.");

    // 1. 10 Service Categories
    console.log("Creating 10 service categories...");
    const categoryNames = [
      "Hair Care & Styling",
      "Skin Care & Facials",
      "Spa & Body Massage",
      "Bridal & Makeup",
      "Nail Art & Pedicure",
      "Men's Grooming & Beard",
      "Waxing & Threading",
      "Hair Coloring & Balayage",
      "Ayurvedic Treatments",
      "Kids & Teen Styling"
    ];

    const categories = await ServiceCategory.insertMany(
      categoryNames.map(category_name => ({ category_name }))
    );
    console.log(`Created ${categories.length} service categories.`);

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.category_name] = cat._id;
    });

    // 2. 10 Salons
    console.log("Creating 10 salon branches...");
    const salonsData = [
      {
        name: "Colombo Elite Branch",
        location: "Colombo, Sri Lanka",
        contact_info: "No. 12, Galle Road, Colombo 03",
        phone: "0112345678",
        email: "colombo@salon.com",
        open_time: "09:00",
        close_time: "18:00",
        capacity: 10,
        revenue: 450000,
        about: "Our flagship luxury salon in Colombo offers premium hair, beauty, and wellness services with state-of-the-art facilities."
      },
      {
        name: "Kandy Heritage Branch",
        location: "Kandy, Sri Lanka",
        contact_info: "No. 78, Peradeniya Road, Kandy",
        phone: "0812345678",
        email: "kandy@salon.com",
        open_time: "09:00",
        close_time: "17:30",
        capacity: 8,
        revenue: 320000,
        about: "Located in the heart of the hill capital, featuring traditional Ayurvedic therapies alongside modern styling."
      },
      {
        name: "Galle Fort Branch",
        location: "Galle, Sri Lanka",
        contact_info: "No. 34, Church Street, Galle Fort",
        phone: "0912345678",
        email: "galle@salon.com",
        open_time: "09:30",
        close_time: "18:30",
        capacity: 7,
        revenue: 280000,
        about: "Boutique aesthetic salon nestled inside historical Galle Fort, specialized in rejuvenating seaside spa sessions."
      },
      {
        name: "Negombo Coastal Branch",
        location: "Negombo, Sri Lanka",
        contact_info: "No. 45, Lewis Place, Negombo",
        phone: "0312345678",
        email: "negombo@salon.com",
        open_time: "09:00",
        close_time: "18:00",
        capacity: 8,
        revenue: 310000,
        about: "Conveniently located near the coastline, offering top-tier hair coloring, tan treatments, and bridal suites."
      },
      {
        name: "Jaffna Royal Branch",
        location: "Jaffna, Sri Lanka",
        contact_info: "No. 88, Hospital Road, Jaffna",
        phone: "0212345678",
        email: "jaffna@salon.com",
        open_time: "08:30",
        close_time: "17:30",
        capacity: 6,
        revenue: 240000,
        about: "Our Jaffna branch provides exquisite traditional Hindu bridal makeovers, hair therapies, and relaxing spa sessions."
      },
      {
        name: "Gampaha City Branch",
        location: "Gampaha, Sri Lanka",
        contact_info: "No. 19, Yakkala Road, Gampaha",
        phone: "0332345678",
        email: "gampaha@salon.com",
        open_time: "09:00",
        close_time: "18:00",
        capacity: 6,
        revenue: 190000,
        about: "Modern family salon providing comprehensive grooming, facial treatments, and express haircuts."
      },
      {
        name: "Kurunegala Central Branch",
        location: "Kurunegala, Sri Lanka",
        contact_info: "No. 52, Colombo Road, Kurunegala",
        phone: "0372345678",
        email: "kurunegala@salon.com",
        open_time: "09:00",
        close_time: "17:30",
        capacity: 6,
        revenue: 210000,
        about: "Premier beauty and hair studio in North Western Province with certified stylists and beauticians."
      },
      {
        name: "Matara Oceanview Branch",
        location: "Matara, Sri Lanka",
        contact_info: "No. 67, Anagarika Dharmapala Mawatha, Matara",
        phone: "0412345678",
        email: "matara@salon.com",
        open_time: "09:00",
        close_time: "18:00",
        capacity: 5,
        revenue: 175000,
        about: "Southern coastal salon offering relaxing scalp treatments, pedicures, and modern hair trends."
      },
      {
        name: "Batticaloa Lagoon Branch",
        location: "Batticaloa, Sri Lanka",
        contact_info: "No. 23, Trinco Road, Batticaloa",
        phone: "0652345678",
        email: "batticaloa@salon.com",
        open_time: "08:30",
        close_time: "17:30",
        capacity: 5,
        revenue: 150000,
        about: "Eastern haven for bridal preparation, soothing massages, and expert skincare consultations."
      },
      {
        name: "Anuradhapura Oasis Branch",
        location: "Anuradhapura, Sri Lanka",
        contact_info: "No. 14, Main Street, Anuradhapura",
        phone: "0252345678",
        email: "anuradhapura@salon.com",
        open_time: "08:30",
        close_time: "17:30",
        capacity: 5,
        revenue: 165000,
        about: "Holistic wellness and beauty salon specializing in herbal remedies, haircuts, and bridal elegance."
      }
    ];

    const salons = await Salon.insertMany(salonsData);
    console.log(`Created ${salons.length} salons.`);

    // 3. 11 Admins (1 Super Admin + 10 Branch Admins)
    console.log("Creating Admins (1 Super Admin + 10 Branch Admins)...");
    const adminsData = [
      {
        full_name: "Super Admin Officer",
        username: "superadmin",
        email: "superadmin@salon.com",
        phone: "0771110000",
        password: passwordHash,
        role: "super-admin",
        salon_id: null,
        mustChangePassword: false,
        mfaEnrolled: true
      },
      ...salons.map((salon, idx) => {
        const slug = salon.name.split(" ")[0].toLowerCase();
        return {
          full_name: `${salon.name.split(" ")[0]} Branch Admin`,
          username: `${slug}admin`,
          email: `${slug}admin@salon.com`,
          phone: `077111${String(idx + 1).padStart(4, "0")}`,
          password: passwordHash,
          role: "manager",
          salon_id: salon._id
        };
      })
    ];

    await Admin.insertMany(adminsData);
    console.log(`Created ${adminsData.length} Admin accounts.`);

    // 4. Service Templates across Categories
    console.log("Creating services for all salons...");
    const serviceTemplates = [
      { service_name: "Signature Haircut & Blowdry", description: "Precision trim, scalp massage, wash, and style.", duration: 60, base_price: 2500, cat: "Hair Care & Styling" },
      { service_name: "Deep Hydration Facial", description: "Revitalizing botanical skin treatment and gentle scrub.", duration: 90, base_price: 4500, cat: "Skin Care & Facials" },
      { service_name: "Swedish Aromatherapy Massage", description: "Full body Swedish massage with essential herbal oils.", duration: 120, base_price: 7500, cat: "Spa & Body Massage" },
      { service_name: "Royal Bridal Makeover", description: "Exquisite bridal makeup, jewellery setting, and hair styling.", duration: 180, base_price: 25000, cat: "Bridal & Makeup" },
      { service_name: "Luxury Gel Pedicure & Manicure", description: "Full nail care, cuticle treatment, polish, and massage.", duration: 60, base_price: 3500, cat: "Nail Art & Pedicure" },
      { service_name: "Executive Beard Grooming", description: "Precision beard shaping, hot towel treatment, and beard oil.", duration: 45, base_price: 1800, cat: "Men's Grooming & Beard" },
      { service_name: "Eyebrow & Upper Lip Threading", description: "Precise eyebrow contouring and facial threading.", duration: 30, base_price: 800, cat: "Waxing & Threading" },
      { service_name: "Balayage & Hair Coloring", description: "Full head hand-painted highlights with gloss finish.", duration: 150, base_price: 12000, cat: "Hair Coloring & Balayage" },
      { service_name: "Ayurvedic Head & Scalp Therapy", description: "Traditional herbal oil therapy to relieve stress and nourish hair.", duration: 60, base_price: 3000, cat: "Ayurvedic Treatments" },
      { service_name: "Kids Trendy Haircut", description: "Fun and gentle haircut designed for kids and teens.", duration: 30, base_price: 1200, cat: "Kids & Teen Styling" },
      { service_name: "Keratin Smooth Treatment", description: "Keratin-infused straightening treatment lasting up to 4 months.", duration: 180, base_price: 15000, cat: "Hair Care & Styling" },
      { service_name: "Anti-Aging Gold Facial", description: "Luxury 24k gold leaf infusion with collagen boosting mask.", duration: 90, base_price: 6500, cat: "Skin Care & Facials" }
    ];

    const allServices = [];
    for (const salon of salons) {
      for (const t of serviceTemplates) {
        const catId = categoryMap[t.cat] || categories[0]._id;
        const s = await Service.create({
          service_name: t.service_name,
          description: t.description,
          duration: t.duration,
          base_price: t.base_price,
          category_id: catId,
          salon_id: salon._id
        });
        allServices.push(s);
      }
    }
    console.log(`Created ${allServices.length} total services across ${salons.length} salons.`);

    // 5. 20+ Staff Members (at least 2 per salon)
    console.log("Creating staff members for all salons...");
    const staffDefinitions = [
      // Colombo
      { full_name: "Kasun Perera", role: "Master Stylist", spec: "Hair Design & Balayage", salonIdx: 0, catName: "Hair Care & Styling" },
      { full_name: "Priyanthi Silva", role: "Skin Specialist", spec: "Dermal Aesthetics & Facials", salonIdx: 0, catName: "Skin Care & Facials" },
      { full_name: "Sanduni Jayasinghe", role: "Spa Therapist", spec: "Swedish & Herbal Body Spa", salonIdx: 0, catName: "Spa & Body Massage" },
      // Kandy
      { full_name: "Dilshan Bandara", role: "Ayurvedic Specialist", spec: "Head Spa & Herbal Care", salonIdx: 1, catName: "Ayurvedic Treatments" },
      { full_name: "Anusha Ratnayake", role: "Bridal Stylist", spec: "Traditional Kandyan Makeup", salonIdx: 1, catName: "Bridal & Makeup" },
      // Galle
      { full_name: "Chamara Fernando", role: "Senior Stylist", spec: "Hair Coloring & Styling", salonIdx: 2, catName: "Hair Coloring & Balayage" },
      { full_name: "Niluka Wickramasinghe", role: "Beautician", spec: "Pedicure & Nail Art", salonIdx: 2, catName: "Nail Art & Pedicure" },
      // Negombo
      { full_name: "Sheron Cooray", role: "Master Barber", spec: "Men's Beard & Hair Grooming", salonIdx: 3, catName: "Men's Grooming & Beard" },
      { full_name: "Fathima Rizan", role: "Aesthetician", spec: "Anti-Aging & Gold Facials", salonIdx: 3, catName: "Skin Care & Facials" },
      // Jaffna
      { full_name: "Janaki Ramachandran", role: "Lead Makeup Artist", spec: "Hindu Bridal & Hair Ornaments", salonIdx: 4, catName: "Bridal & Makeup" },
      { full_name: "Sinthujan Selvarajah", role: "Hair Specialist", spec: "Keratin & Straightening", salonIdx: 4, catName: "Hair Care & Styling" },
      // Gampaha
      { full_name: "Kavisha Ranasinghe", role: "Stylist", spec: "Modern Cuts & Kids Styling", salonIdx: 5, catName: "Kids & Teen Styling" },
      { full_name: "Nadeesha Perera", role: "Beautician", spec: "Skin Care & Threading", salonIdx: 5, catName: "Waxing & Threading" },
      // Kurunegala
      { full_name: "Roshan Gunawardena", role: "Senior Stylist", spec: "Hair Coloring & Balayage", salonIdx: 6, catName: "Hair Coloring & Balayage" },
      { full_name: "Madhusha Jayawardena", role: "Nail Artist", spec: "Gel Nails & Manicure", salonIdx: 6, catName: "Nail Art & Pedicure" },
      // Matara
      { full_name: "Thisara Silva", role: "Stylist", spec: "Beard Grooming & Hair Cuts", salonIdx: 7, catName: "Men's Grooming & Beard" },
      { full_name: "Minoli Peiris", role: "Spa Therapist", spec: "Aromatherapy & Body Scrub", salonIdx: 7, catName: "Spa & Body Massage" },
      // Batticaloa
      { full_name: "Luxman Balakrishnan", role: "Ayurvedic Expert", spec: "Herbal Scalp & Body Spa", salonIdx: 8, catName: "Ayurvedic Treatments" },
      { full_name: "Tharshini Koneswaran", role: "Bridal Beautician", spec: "Bridal Dressing & Threading", salonIdx: 8, catName: "Bridal & Makeup" },
      // Anuradhapura
      { full_name: "Devinda Senanayake", role: "Master Stylist", spec: "Precision Cuts & Hair Care", salonIdx: 9, catName: "Hair Care & Styling" },
      { full_name: "Oshadi Ranasinghe", role: "Skin Consultant", spec: "Organic Facials & Skin Glow", salonIdx: 9, catName: "Skin Care & Facials" }
    ];

    const allStaff = [];
    for (const def of staffDefinitions) {
      const salon = salons[def.salonIdx];
      const salonServices = allServices.filter(s => s.salon_id.equals(salon._id));
      const targetCatId = categoryMap[def.catName];
      const matchedServices = salonServices.filter(s => s.category_id.equals(targetCatId));
      const assignedServices = matchedServices.length > 0 ? matchedServices : salonServices.slice(0, 3);

      const staffMember = await Staff.create({
        full_name: def.full_name,
        phone: `077${Math.floor(1000000 + Math.random() * 9000000)}`,
        email: `${def.full_name.toLowerCase().replace(/\s+/g, "")}@salon.com`,
        password_hash: passwordHash,
        role: def.role,
        specification: def.spec,
        commission_rate: 15,
        salary_payment_frequency: "monthly",
        salary_payment_count_per_day: 1,
        status: "Active",
        salon_id: salon._id,
        image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(def.full_name)}`,
        services: assignedServices.map(s => s._id)
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

    // 6. Generate 30 Days Availability for all Staff
    console.log("Generating 30 days of staff availability schedules (09:00 - 17:00)...");
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

    const availabilityDocs = [];
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

    // 7. 20 Customers
    console.log("Creating 20 sample customer accounts...");
    const customerNames = [
      "Ruwan Gamage", "Nipuni Perera", "Sachini Fernando", "Chathura de Silva",
      "Dinuka Herath", "Eranga Bandara", "Madhusha Jayawardena", "Roshan Gunawardena",
      "Minoli Peiris", "Thilina Ratnayake", "Pathum Nissanka", "Oshadi Ranasinghe",
      "Nilanthi Cooray", "Isuru Udana", "Hashini Samarakoon", "Devinda Perera",
      "Nadeesha Hemamali", "Duminda Silva", "Vimukthi Wickrama", "Gayani Liyanage"
    ];

    const customersData = customerNames.map((name, i) => {
      const email = `${name.toLowerCase().replace(/\s+/g, "")}@example.com`;
      const phone = `07712345${String(i).padStart(2, "0")}`;
      const regDate = new Date();
      regDate.setDate(regDate.getDate() - (i + 1) * 3);

      return {
        name,
        phone,
        email,
        registration_date: regDate,
        password_hash: passwordHash,
        role: "customer",
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
      };
    });

    const customers = await Customer.insertMany(customersData);
    console.log(`Created ${customers.length} sample customers.`);

    // 8. 15+ Detailed Appointments
    console.log("Generating 15 appointments with full lifecycle statuses...");
    const getFormattedDate = (offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.toISOString().split("T")[0];
    };

    const pastDate1 = getFormattedDate(-2);
    const pastDate2 = getFormattedDate(-1);
    const today = getFormattedDate(0);
    const tomorrow = getFormattedDate(1);
    const dayAfter = getFormattedDate(2);
    const futureDate = getFormattedDate(5);

    const findStaffObj = (salonId, name) => allStaff.find(s => s.salon_id.equals(salonId) && s.full_name === name) || allStaff.find(s => s.salon_id.equals(salonId));
    const findServiceObj = (salonId, name) => allServices.find(s => s.salon_id.equals(salonId) && s.service_name === name) || allServices.find(s => s.salon_id.equals(salonId));

    const appointmentSpecs = [
      // 1. Completed appointment (Colombo)
      {
        salon: salons[0],
        customer: customers[0],
        staffName: "Kasun Perera",
        serviceName: "Signature Haircut & Blowdry",
        date: pastDate2,
        start_time: "10:00",
        duration: 60,
        status: "completed",
        notes: "Regular client, requested classic fade and styling.",
        feedback: { serviceRating: 5, staffRating: 5, comment: "Exceptional service by Kasun! Loved the precision trim." },
        bill: { amount: 2500, method: "Card", status: "paid" }
      },
      // 2. Completed appointment (Colombo)
      {
        salon: salons[0],
        customer: customers[1],
        staffName: "Priyanthi Silva",
        serviceName: "Deep Hydration Facial",
        date: pastDate1,
        start_time: "14:00",
        duration: 90,
        status: "completed",
        notes: "Client has sensitive skin. Used organic botanical serums.",
        feedback: { serviceRating: 5, staffRating: 5, comment: "Skin feels glowing and refreshed. Priyanthi was wonderful." },
        bill: { amount: 4500, method: "Cash", status: "paid" }
      },
      // 3. Completed appointment (Kandy)
      {
        salon: salons[1],
        customer: customers[2],
        staffName: "Anusha Ratnayake",
        serviceName: "Royal Bridal Makeover",
        date: pastDate1,
        start_time: "09:00",
        duration: 180,
        status: "completed",
        notes: "Bridal dressing for Kandyan wedding ceremony.",
        feedback: { serviceRating: 5, staffRating: 5, comment: "Dream wedding look accomplished! Absolutely stunning makeup." },
        bill: { amount: 25000, method: "Online", status: "paid" }
      },
      // 4. Completed appointment (Galle)
      {
        salon: salons[2],
        customer: customers[3],
        staffName: "Chamara Fernando",
        serviceName: "Balayage & Hair Coloring",
        date: pastDate2,
        start_time: "11:00",
        duration: 150,
        status: "completed",
        notes: "Caramel balayage blend with tone lock shine.",
        feedback: { serviceRating: 5, staffRating: 4, comment: "Great color blend and very friendly staff in Galle Fort." },
        bill: { amount: 12000, method: "Card", status: "paid" }
      },
      // 5. Completed appointment (Negombo)
      {
        salon: salons[3],
        customer: customers[4],
        staffName: "Sheron Cooray",
        serviceName: "Executive Beard Grooming",
        date: pastDate1,
        start_time: "15:00",
        duration: 45,
        status: "completed",
        notes: "Hot towel therapy and precision outline.",
        feedback: { serviceRating: 5, staffRating: 5, comment: "Best beard trim in Negombo. Highly recommend Sheron." },
        bill: { amount: 1800, method: "Cash", status: "paid" }
      },
      // 6. Confirmed appointment today (Colombo)
      {
        salon: salons[0],
        customer: customers[5],
        staffName: "Sanduni Jayasinghe",
        serviceName: "Swedish Aromatherapy Massage",
        date: today,
        start_time: "13:00",
        duration: 120,
        status: "confirmed",
        notes: "Client requested lavender relaxation oil.",
        bill: { amount: 7500, method: "Card", status: "pending" }
      },
      // 7. Confirmed appointment tomorrow (Jaffna)
      {
        salon: salons[4],
        customer: customers[6],
        staffName: "Janaki Ramachandran",
        serviceName: "Royal Bridal Makeover",
        date: tomorrow,
        start_time: "10:00",
        duration: 180,
        status: "confirmed",
        notes: "Bridal trial makeup and jewellery fitting.",
        bill: { amount: 25000, method: "Online", status: "pending" }
      },
      // 8. Confirmed appointment tomorrow (Kandy)
      {
        salon: salons[1],
        customer: customers[7],
        staffName: "Dilshan Bandara",
        serviceName: "Ayurvedic Head & Scalp Therapy",
        date: tomorrow,
        start_time: "11:00",
        duration: 60,
        status: "confirmed",
        notes: "Ayurvedic Neelayadi oil scalp treatment.",
        bill: { amount: 3000, method: "Cash", status: "pending" }
      },
      // 9. Confirmed appointment dayAfter (Gampaha)
      {
        salon: salons[5],
        customer: customers[8],
        staffName: "Kavisha Ranasinghe",
        serviceName: "Kids Trendy Haircut",
        date: dayAfter,
        start_time: "14:00",
        duration: 30,
        status: "confirmed",
        notes: "Back to school haircuts for 2 kids.",
        bill: { amount: 1200, method: "Cash", status: "pending" }
      },
      // 10. Confirmed appointment future (Kurunegala)
      {
        salon: salons[6],
        customer: customers[9],
        staffName: "Roshan Gunawardena",
        serviceName: "Signature Haircut & Blowdry",
        date: futureDate,
        start_time: "10:00",
        duration: 60,
        status: "confirmed",
        notes: "Special event styling and blow dry.",
        bill: { amount: 2500, method: "Card", status: "pending" }
      },
      // 11. Pending appointment tomorrow (Matara)
      {
        salon: salons[7],
        customer: customers[10],
        staffName: "Minoli Peiris",
        serviceName: "Swedish Aromatherapy Massage",
        date: tomorrow,
        start_time: "15:00",
        duration: 120,
        status: "pending",
        notes: "Pending confirmation from client phone verification."
      },
      // 12. Pending appointment dayAfter (Batticaloa)
      {
        salon: salons[8],
        customer: customers[11],
        staffName: "Luxman Balakrishnan",
        serviceName: "Ayurvedic Head & Scalp Therapy",
        date: dayAfter,
        start_time: "10:00",
        duration: 60,
        status: "pending",
        notes: "Online web booking waiting for staff review."
      },
      // 13. Pending appointment future (Anuradhapura)
      {
        salon: salons[9],
        customer: customers[12],
        staffName: "Oshadi Ranasinghe",
        serviceName: "Deep Hydration Facial",
        date: futureDate,
        start_time: "09:30",
        duration: 90,
        status: "pending",
        notes: "First time customer consultation."
      },
      // 14. Cancelled appointment past (Colombo)
      {
        salon: salons[0],
        customer: customers[13],
        staffName: "Kasun Perera",
        serviceName: "Keratin Smooth Treatment",
        date: pastDate1,
        start_time: "09:00",
        duration: 180,
        status: "cancelled",
        notes: "Customer had to reschedule due to travel emergency."
      },
      // 15. Rejected appointment past (Galle)
      {
        salon: salons[2],
        customer: customers[14],
        staffName: "Niluka Wickramasinghe",
        serviceName: "Luxury Gel Pedicure & Manicure",
        date: pastDate2,
        start_time: "16:00",
        duration: 60,
        status: "rejected",
        notes: "Slot was already booked for a private bridal VIP group."
      }
    ];

    const createdAppointments = [];
    const createdBills = [];
    const createdFeedbacks = [];
    const createdNotifications = [];

    for (const spec of appointmentSpecs) {
      const salon = spec.salon;
      const customer = spec.customer;
      const staff = findStaffObj(salon._id, spec.staffName);
      const service = findServiceObj(salon._id, spec.serviceName);

      const duration = spec.duration || service.duration || 60;
      const durationHours = Math.ceil(duration / 60);
      const end_time = addHours(spec.start_time, durationHours);

      const app = await Appointment.create({
        customer_id: customer._id,
        salon_id: salon._id,
        service_id: service._id,
        service_ids: [service._id],
        staff_id: staff._id,
        appointment_date: spec.date,
        start_time: spec.start_time,
        end_time: end_time,
        duration: duration,
        status: spec.status,
        total_price: spec.bill ? spec.bill.amount : service.base_price,
        notes: spec.notes || "",
        feedback_submitted: !!spec.feedback,
        confirmed_at: ["confirmed", "completed"].includes(spec.status) ? new Date() : null,
        rejected_at: spec.status === "rejected" ? new Date() : null,
        cancelled_at: spec.status === "cancelled" ? new Date() : null
      });
      createdAppointments.push(app);

      // Lock slots for confirmed & completed appointments
      if (["confirmed", "completed"].includes(spec.status)) {
        const queryDate = new Date(spec.date);
        queryDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);

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

      // Bill creation
      if (spec.bill) {
        const bill = await Bill.create({
          appointment_id: app._id,
          total_amount: spec.bill.amount,
          bill_date: new Date(spec.date),
          payment_method: spec.bill.method,
          payout_status: spec.bill.status,
          paid_out_at: spec.bill.status === "paid" ? new Date(spec.date) : null
        });
        createdBills.push(bill);
      }

      // Feedback & Review creation
      if (spec.feedback) {
        const fb = await Feedback.create({
          appointment_id: app._id,
          salon_id: salon._id,
          customer_id: customer._id,
          service_id: service._id,
          staff_id: staff._id,
          serviceRating: spec.feedback.serviceRating,
          staffRating: spec.feedback.staffRating,
          comment: spec.feedback.comment
        });
        createdFeedbacks.push(fb);

        await Review.create({
          appointment_id: app._id,
          rating: spec.feedback.serviceRating,
          comment: spec.feedback.comment,
          review_date: new Date(spec.date)
        });
      }

      // Notifications
      const notif = await Notification.create({
        recipient_id: customer._id,
        recipient_model: "Customer",
        title: `Appointment ${spec.status.toUpperCase()}`,
        message: `Your booking for ${service.service_name} at ${salon.name} on ${spec.date} at ${spec.start_time} is ${spec.status}.`,
        is_read: spec.status === "completed",
        appointment_id: app._id
      });
      createdNotifications.push(notif);
    }

    console.log(`Created ${createdAppointments.length} appointments.`);
    console.log(`Created ${createdBills.length} billing records.`);
    console.log(`Created ${createdFeedbacks.length} feedback & review entries.`);
    console.log(`Created ${createdNotifications.length} notification items.`);

    // 10+ Additional direct reviews for platform showcase
    console.log("Adding additional platform review entries...");
    const extraReviewsData = [
      { rating: 5, comment: "Amazing ambience and world-class service in Colombo!", date: new Date() },
      { rating: 5, comment: "The bridal package in Kandy was perfection.", date: new Date() },
      { rating: 4, comment: "Very relaxing massage experience inside Galle Fort.", date: new Date() },
      { rating: 5, comment: "Staff is highly skilled, very courteous and clean salon.", date: new Date() },
      { rating: 5, comment: "Fast booking and seamless payment. Best salon network!", date: new Date() }
    ];
    for (let i = 0; i < extraReviewsData.length; i++) {
      await Review.create({
        appointment_id: createdAppointments[i] ? createdAppointments[i]._id : null,
        rating: extraReviewsData[i].rating,
        comment: extraReviewsData[i].comment,
        review_date: extraReviewsData[i].date
      });
    }

    console.log("\n=======================================================");
    console.log("DATABASE SEED SUMMARY:");
    console.log(`• Salons:              ${salons.length}`);
    console.log(`• Service Categories:  ${categories.length}`);
    console.log(`• Total Services:      ${allServices.length}`);
    console.log(`• Staff Members:       ${allStaff.length}`);
    console.log(`• Availability Records:${availabilityDocs.length}`);
    console.log(`• Customers:           ${customers.length}`);
    console.log(`• Admin Accounts:      ${adminsData.length}`);
    console.log(`• Appointments:        ${createdAppointments.length}`);
    console.log(`• Bills / Invoices:    ${createdBills.length}`);
    console.log(`• Feedbacks / Reviews: ${createdFeedbacks.length + extraReviewsData.length}`);
    console.log(`• Notifications:       ${createdNotifications.length}`);
    console.log("=======================================================\n");

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
