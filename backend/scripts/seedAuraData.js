import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import Salary from '../models/Salary.js';
import ServiceCategory from '../models/ServiceCategory.js';

async function seedAura() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // 1. Locate AURA Salon
    const auraSalon = await Salon.findOne({ name: { $regex: '^AURA$', $options: 'i' } });
    if (!auraSalon) {
      console.error('Error: AURA salon not found!');
      process.exit(1);
    }
    const salonId = auraSalon._id;
    console.log(`Found AURA Salon: ${auraSalon.name} (${salonId})`);

    // Update Salon info
    auraSalon.about = 'Welcome to AURA Salon Gampaha – where luxury meets personalized style and care. Our master stylists and certified wellness therapists deliver bespoke hair styling, rejuvenation facials, therapeutic spas, and radiant bridal artistry in an ambiance of pure serenity.';
    auraSalon.status = 'active';
    await auraSalon.save();
    console.log('Updated AURA Salon details');

    // 2. Fetch Categories
    const categories = await ServiceCategory.find().lean();
    const catMap = {};
    categories.forEach(c => {
      catMap[c.category_name.toLowerCase()] = c._id;
    });
    console.log('Categories loaded:', Object.keys(catMap));

    // 3. Define Services for AURA
    const servicesData = [
      // Hair
      {
        service_name: "Men's Classic Haircut & Styling",
        base_price: 800,
        duration: 30,
        description: 'Precision haircut, hair wash, blow dry and modern matte styling.',
        category_id: catMap['hair'],
        salon_id: salonId,
        status: 'Active'
      },
      {
        service_name: "Women's Signature Layer & Blowout",
        base_price: 1800,
        duration: 45,
        description: 'Personalized cut, volume layering, and professional blowout styling.',
        category_id: catMap['hair'],
        salon_id: salonId,
        status: 'Active'
      },
      {
        service_name: 'Beard Sculpting & Royal Hot Shave',
        base_price: 600,
        duration: 25,
        description: 'Warm towel therapy, edge detailing, and nourishing beard butter finish.',
        category_id: catMap['hair'],
        salon_id: salonId,
        status: 'Active'
      },
      {
        service_name: 'Luxury Hair Coloring & Highlights',
        base_price: 3500,
        duration: 60,
        description: 'Full-coverage color, balayage, or foil highlights with gloss treatment.',
        category_id: catMap['hair'],
        salon_id: salonId,
        status: 'Active'
      },
      {
        service_name: 'Keratin Smoothing Treatment',
        base_price: 6000,
        duration: 90,
        description: 'Deep keratin infusion for frizz-free, silky smooth, manageable hair.',
        category_id: catMap['hair'],
        salon_id: salonId,
        status: 'Active'
      },
      // Beauty
      {
        service_name: 'Herbal Glow Radiance Facial',
        base_price: 2800,
        duration: 60,
        description: 'Botanical deep pore cleansing, steam extraction, and herbal radiance pack.',
        category_id: catMap['beauty'],
        salon_id: salonId,
        status: 'Active'
      },
      {
        service_name: 'Purifying Charcoal Skin Clean Up',
        base_price: 1800,
        duration: 40,
        description: 'Activated charcoal mask, blackhead removal, and pore-minimizing toning.',
        category_id: catMap['beauty'],
        salon_id: salonId,
        status: 'Active'
      },
      {
        service_name: 'Deluxe Manicure & Pedicure',
        base_price: 3200,
        duration: 60,
        description: 'Cuticle care, gentle scrub, paraffin mask, massage, and nail buffing.',
        category_id: catMap['beauty'],
        salon_id: salonId,
        status: 'Active'
      },
      // Spa
      {
        service_name: 'Stress Relief Head & Shoulder Massage',
        base_price: 1500,
        duration: 30,
        description: 'Therapeutic herbal oil massage to melt away tension and mental fatigue.',
        category_id: catMap['spa'],
        salon_id: salonId,
        status: 'Active'
      },
      {
        service_name: 'Deep Conditioning Intensive Hair Spa',
        base_price: 2500,
        duration: 45,
        description: 'Nutritive hair mask, relaxing scalp massage, and ozone steam rejuvenation.',
        category_id: catMap['spa'],
        salon_id: salonId,
        status: 'Active'
      },
      // Makeup
      {
        service_name: 'Bridal & Evening Glam Makeup',
        base_price: 7500,
        duration: 90,
        description: 'Flawless HD long-wear makeup with contouring, eye styling, and setting mist.',
        category_id: catMap['makeup'],
        salon_id: salonId,
        status: 'Active'
      }
    ];

    // Upsert / Create Services
    const createdServices = [];
    for (const sData of servicesData) {
      let svc = await Service.findOne({ salon_id: salonId, service_name: sData.service_name });
      if (!svc) {
        svc = await Service.create(sData);
        console.log(`Created service: ${svc.service_name} (Rs. ${svc.base_price})`);
      } else {
        svc.base_price = sData.base_price;
        svc.duration = sData.duration;
        svc.description = sData.description;
        svc.category_id = sData.category_id;
        svc.status = 'Active';
        await svc.save();
        console.log(`Updated service: ${svc.service_name}`);
      }
      createdServices.push(svc);
    }

    const svcByName = {};
    createdServices.forEach(s => {
      svcByName[s.service_name] = s._id;
    });

    // 4. Update Manager Suranga Madushan
    const manager = await Staff.findOne({ salon_id: salonId, role: 'manager' });
    if (manager) {
      manager.salary_payment_count_per_day = 2500;
      manager.salary_payment_frequency = 'monthly';
      manager.salaryCalculationEnabled = true;
      manager.status = 'Active';
      await manager.save();
      console.log(`Updated Manager: ${manager.full_name} with daily pay rate Rs. 2,500`);

      // Update manager's November salary record
      await Salary.findOneAndUpdate(
        { salon_id: salonId, staff_id: manager._id, period: '2026-11' },
        {
          $set: {
            salary_payment_count_per_day: 2500,
            staff_name: manager.full_name,
            staff_role: manager.role,
            frequency: 'monthly'
          }
        }
      );
    }

    // 5. Seed Staff Members
    const defaultPassword = 'Password123#';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const today = '2026-11-14';
    const currentMonthPeriod = '2026-11';

    const staffMembersData = [
      {
        first_name: 'Kavindu',
        last_name: 'Fernando',
        full_name: 'Kavindu Fernando',
        email: 'kavindu.aura@gmail.com',
        phone: '0772134567',
        role: 'staff',
        specification: 'Senior Hair Stylist & Barber',
        commission_rate: 10,
        salary_payment_frequency: 'daily',
        salary_payment_count_per_day: 1500,
        services: [
          svcByName["Men's Classic Haircut & Styling"],
          svcByName["Women's Signature Layer & Blowout"],
          svcByName['Beard Sculpting & Royal Hot Shave'],
          svcByName['Luxury Hair Coloring & Highlights'],
          svcByName['Keratin Smoothing Treatment'],
          svcByName['Deep Conditioning Intensive Hair Spa']
        ]
      },
      {
        first_name: 'Nethmi',
        last_name: 'Jayawardena',
        full_name: 'Nethmi Jayawardena',
        email: 'nethmi.aura@gmail.com',
        phone: '0773245678',
        role: 'staff',
        specification: 'Aesthetician & Skincare Specialist',
        commission_rate: 10,
        salary_payment_frequency: 'daily',
        salary_payment_count_per_day: 1400,
        services: [
          svcByName['Herbal Glow Radiance Facial'],
          svcByName['Purifying Charcoal Skin Clean Up'],
          svcByName['Deluxe Manicure & Pedicure'],
          svcByName['Stress Relief Head & Shoulder Massage']
        ]
      },
      {
        first_name: 'Tharindu',
        last_name: 'Perera',
        full_name: 'Tharindu Perera',
        email: 'tharindu.aura@gmail.com',
        phone: '0774356789',
        role: 'staff',
        specification: 'Spa & Wellness Therapist',
        commission_rate: 8,
        salary_payment_frequency: 'monthly',
        salary_payment_count_per_day: 1300,
        services: [
          svcByName['Stress Relief Head & Shoulder Massage'],
          svcByName['Deep Conditioning Intensive Hair Spa'],
          svcByName["Men's Classic Haircut & Styling"],
          svcByName['Beard Sculpting & Royal Hot Shave']
        ]
      },
      {
        first_name: 'Rashmi',
        last_name: 'Wickramasinghe',
        full_name: 'Rashmi Wickramasinghe',
        email: 'rashmi.aura@gmail.com',
        phone: '0775467890',
        role: 'staff',
        specification: 'Bridal Makeup Artist & Hair Stylist',
        commission_rate: 15,
        salary_payment_frequency: 'monthly',
        salary_payment_count_per_day: 1800,
        services: [
          svcByName['Bridal & Evening Glam Makeup'],
          svcByName["Women's Signature Layer & Blowout"],
          svcByName['Luxury Hair Coloring & Highlights'],
          svcByName['Deluxe Manicure & Pedicure'],
          svcByName['Herbal Glow Radiance Facial']
        ]
      }
    ];

    for (const sInfo of staffMembersData) {
      let staffDoc = await Staff.findOne({ email: sInfo.email });
      if (!staffDoc) {
        staffDoc = await Staff.create({
          ...sInfo,
          password_hash: hashedPassword,
          mustChangePassword: false,
          salaryCalculationEnabled: true,
          status: 'Active',
          salon_id: salonId
        });
        console.log(`Created staff: ${staffDoc.full_name} (${staffDoc.email})`);
      } else {
        staffDoc.first_name = sInfo.first_name;
        staffDoc.last_name = sInfo.last_name;
        staffDoc.full_name = sInfo.full_name;
        staffDoc.phone = sInfo.phone;
        staffDoc.specification = sInfo.specification;
        staffDoc.commission_rate = sInfo.commission_rate;
        staffDoc.salary_payment_frequency = sInfo.salary_payment_frequency;
        staffDoc.salary_payment_count_per_day = sInfo.salary_payment_count_per_day;
        staffDoc.services = sInfo.services;
        staffDoc.salon_id = salonId;
        staffDoc.status = 'Active';
        await staffDoc.save();
        console.log(`Updated staff: ${staffDoc.full_name}`);
      }

      // Initialize Salary record
      const isDaily = sInfo.salary_payment_frequency === 'daily';
      const period = isDaily ? today : currentMonthPeriod;
      const dateRange = isDaily
        ? { start: today, end: today }
        : { start: today, end: '2026-11-30' };

      const existingSalary = await Salary.findOne({
        salon_id: salonId,
        staff_id: staffDoc._id,
        period: period,
        frequency: sInfo.salary_payment_frequency
      });

      if (!existingSalary) {
        await Salary.create({
          salon_id: salonId,
          staff_id: staffDoc._id,
          employmentStartDate: today,
          frequency: sInfo.salary_payment_frequency,
          period: period,
          cycleId: null,
          calculationStartDate: today,
          staff_name: staffDoc.full_name,
          staff_role: staffDoc.role,
          commission_rate: staffDoc.commission_rate,
          salary_payment_count_per_day: staffDoc.salary_payment_count_per_day,
          workingAmount: 0,
          rate: staffDoc.commission_rate,
          workRate: 0,
          daySalary: isDaily ? staffDoc.salary_payment_count_per_day : 0,
          totalSalary: isDaily ? staffDoc.salary_payment_count_per_day : 0,
          status: 'Not Paid',
          year: 2026,
          month: 11,
          dateRange: dateRange,
          dailyRecords: []
        });
        console.log(`Initialized ${sInfo.salary_payment_frequency} salary for ${staffDoc.full_name} (${period})`);
      } else {
        existingSalary.salary_payment_count_per_day = staffDoc.salary_payment_count_per_day;
        existingSalary.commission_rate = staffDoc.commission_rate;
        existingSalary.rate = staffDoc.commission_rate;
        if (isDaily && existingSalary.workingAmount === 0) {
          existingSalary.daySalary = staffDoc.salary_payment_count_per_day;
          existingSalary.totalSalary = staffDoc.salary_payment_count_per_day;
        }
        await existingSalary.save();
        console.log(`Updated salary record for ${staffDoc.full_name}`);
      }
    }

    // 6. Update total staff count in Salon
    const totalStaffCount = await Staff.countDocuments({ salon_id: salonId, status: 'Active' });
    auraSalon.staffCount = totalStaffCount;
    await auraSalon.save();
    console.log(`Salon AURA updated with total staffCount: ${totalStaffCount}`);

    console.log('\n--- ALL AURA DATA SUCCESSFULLY POPULATED ---');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seedAura();
