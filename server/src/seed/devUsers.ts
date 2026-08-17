import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import { PLAN_DEFINITIONS } from '../config/constants.js';

/**
 * Non-destructive dev login seeder. Unlike seed.ts this never drops collections —
 * it only creates (or resets) the throwaway accounts below, so it is safe to run
 * against a database that already has real books and borrows in it.
 *
 * Run with: npm run seed:users --workspace=server
 */

const DEV_ACCOUNTS = [
  {
    name: 'Dev Admin',
    email: 'admin@dev.local',
    password: 'admin123',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    phone: '9000000001',
  },
  {
    name: 'Dev User',
    email: 'user@dev.local',
    password: 'user123',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    phone: '9000000002',
    children: [{ name: 'Dev Kid', ageMin: 4, ageMax: 8 }],
    /** Gives this account borrow quota so member-only flows are reachable. */
    plan: 'STAR_READER' as const,
  },
  {
    name: 'Dev Pending',
    email: 'pending@dev.local',
    password: 'pending123',
    role: 'USER' as const,
    status: 'PENDING' as const,
    phone: '9000000003',
  },
];

async function upsertAccount(account: (typeof DEV_ACCOUNTS)[number]) {
  const { plan, ...fields } = account as typeof account & { plan?: keyof typeof PLAN_DEFINITIONS };

  let user = await User.findOne({ email: fields.email });
  if (user) {
    // Reset the fields that matter so a half-broken dev account heals on re-run.
    Object.assign(user, fields);
  } else {
    user = new User(fields);
  }
  // Assigning password marks it modified, so the pre-save hook re-hashes it.
  user.password = fields.password;
  await user.save();

  if (plan) {
    const allowance = PLAN_DEFINITIONS[plan].allowance;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);

    await Membership.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        plan,
        durationMonths: 12,
        startDate,
        endDate,
        status: 'ACTIVE',
        booksPerCycle: allowance.booksPerCycle,
        monthlyBookLimit: allowance.monthlyBookLimit,
        monthlyPuzzleLimit: allowance.monthlyPuzzleLimit,
        monthlyTotalLimit: allowance.monthlyTotalLimit,
      },
      { upsert: true, new: true }
    );
  }

  return user;
}

async function run() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed dev logins with NODE_ENV=production.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB.\n');

  for (const account of DEV_ACCOUNTS) {
    await upsertAccount(account);
    console.log(
      `  ${account.role.padEnd(5)} ${account.status.padEnd(7)} ${account.email.padEnd(20)} ${account.password}`
    );
  }

  console.log('\nDev logins ready.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Dev user seed failed:', err);
  process.exit(1);
});
