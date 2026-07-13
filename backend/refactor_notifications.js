import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'controllers', 'appointmentController.js');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const adminsToNotify = await Admin\.find\(\{\s*role: \{ \$in: \["staff-admin", "manager"\] \},\s*salon_id: ([a-zA-Z._]+)\s*\}\);\s*const notifications = adminsToNotify\.map\(admin => \(\{\s*recipient_id: admin\._id,\s*recipient_model: "Admin",\s*title: "([^"]+)",\s*message: `([^`]+)`,\s*appointment_id: ([a-zA-Z._]+)\s*\}\)\);\s*if \(notifications\.length > 0\) \{\s*await Notification\.insertMany\(notifications\);\s*\}/g;

content = content.replace(regex, (match, pSalonId, pTitle, pMessage, pApptId) => {
  return `const adminsToNotify = await Admin.find({
        role: { $in: ["staff-admin", "manager"] },
        salon_id: ${pSalonId}
      });
      const managersToNotify = await Staff.find({
        role: "manager",
        salon_id: ${pSalonId}
      });
      
      const adminNotifs = adminsToNotify.map(admin => ({
        recipient_id: admin._id,
        recipient_model: "Admin",
        title: "${pTitle}",
        message: \`${pMessage}\`,
        appointment_id: ${pApptId}
      }));
      
      const staffNotifs = managersToNotify.map(staff => ({
        recipient_id: staff._id,
        recipient_model: "Staff",
        title: "${pTitle}",
        message: \`${pMessage}\`,
        appointment_id: ${pApptId}
      }));
      
      const notifications = [...adminNotifs, ...staffNotifs];
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replaced successfully!");
