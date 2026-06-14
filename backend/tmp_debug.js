import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('./.env') });

const root = path.resolve('./');
const ignore = ['node_modules', '.git', '.cache'];
const needle = 'ownerName';
let found = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignore.includes(entry.name)) continue;
      walk(p);
      continue;
    }
    if (!/\.(js|jsx|ts|json|mjs|cjs)$/.test(entry.name)) continue;
    if (p.endsWith('tmp_debug.js')) continue;
    try {
      const text = fs.readFileSync(p, 'utf8');
      text.split(/\r?\n/).forEach((line, idx) => {
        if (line.includes(needle)) {
          found.push(`${p}:${idx + 1}:${line}`);
        }
      });
    } catch (e) {
      // ignore
    }
  }
}

walk(root);
console.log('MONGO_URI', process.env.MONGO_URI || 'NONE');
console.log('FOUND', found.length);
console.log(found.join('\n'));

try {
  const mongoose = await import('mongoose');
  const Admin = await import('./models/Admin.js');
  await mongoose.default.connect(process.env.MONGO_URI);
  const superAdmin = await Admin.default.findOne({ role: 'super-admin' }).lean();
  console.log('SUPER_ADMIN', superAdmin ? { _id: superAdmin._id.toString(), email: superAdmin.email, username: superAdmin.username, role: superAdmin.role } : 'NONE');
  await mongoose.default.disconnect();
} catch (error) {
  console.error('DB ERROR', error.message);
}
