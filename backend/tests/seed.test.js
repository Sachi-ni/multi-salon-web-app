import Admin from "../models/Admin.js";
import { seedSuperAdmin } from "../seed/seedSuperAdmin.js";

beforeEach(() => {
  process.env.SUPERADMIN_EMAIL = "seeded@example.com";
  process.env.SUPERADMIN_INITIAL_PASSWORD = "Strong!Pass1";
});

test("SuperAdmin seeding is idempotent and hardens the account", async () => {
  await seedSuperAdmin();
  await seedSuperAdmin();
  expect(await Admin.countDocuments({ role: "super-admin" })).toBe(1);
  const admin = await Admin.findOne({ role: "super-admin" });
  expect(admin.mustChangePassword).toBe(true);
  expect(admin.mfaEnrolled).toBe(false);
});
