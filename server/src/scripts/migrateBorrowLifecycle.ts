import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Borrow from '../models/Borrow.js';

/**
 * One-time migration onto the status/fulfilment split.
 *
 * Old shape:
 *   status:         ACTIVE | RETURNED | OVERDUE
 *   deliveryStatus: UNASSIGNED | ASSIGNED | COMPLETED
 *   deliveryType:   DELIVERY | PICKUP
 *   deliveryPerson{Name,Phone}, deliveryAssignedAt
 *
 * New shape:
 *   status:     ACTIVE | RETURNED          (is the copy back?)
 *   fulfilment: PREPARING → … → COLLECTED  (where is it?)
 *   delivery{}, pickup{}                   (one partner record per leg)
 *
 * Notes on the mapping:
 *  - OVERDUE collapses into ACTIVE. Lateness is now derived from `dueDate`, so
 *    nothing is lost, and late copies stop reading as available stock.
 *  - Legacy rows all have a dueDate set at checkout. We keep it rather than
 *    clearing it — rewriting live loans would move members' deadlines. Only
 *    orders placed from now on get the delivery-based clock. Undelivered legacy
 *    rows get `deliveredAt` backfilled from `issueDate` so the two stay
 *    consistent.
 *  - The old single partner record is ambiguous once it has been reused for
 *    both legs. We attribute it to the pickup leg when the row was awaiting
 *    return, and to the delivery leg otherwise.
 *
 * Run with:  npm run migrate:borrows --workspace=server
 * Safe to run more than once — rows already carrying `fulfilment` are skipped.
 */

type LegacyBorrow = {
  _id: mongoose.Types.ObjectId;
  status?: string;
  issueDate?: Date;
  dueDate?: Date;
  returnDate?: Date;
  returnRequested?: boolean;
  returnRequestedAt?: Date;
  fulfilment?: string;
  deliveryStatus?: string;
  deliveryType?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  deliveryAssignedAt?: Date;
};

function deriveFulfilment(row: LegacyBorrow): string {
  if (row.status === 'RETURNED') return 'COLLECTED';
  if (row.returnRequested) {
    // A partner was already attached to the return leg.
    return row.deliveryStatus === 'ASSIGNED' && row.deliveryType === 'PICKUP'
      ? 'PICKUP_SCHEDULED'
      : 'RETURN_REQUESTED';
  }
  if (row.deliveryStatus === 'ASSIGNED' && row.deliveryType !== 'PICKUP') return 'OUT_FOR_DELIVERY';
  if (row.deliveryStatus === 'UNASSIGNED' || !row.deliveryStatus) {
    // Legacy rows started their loan at checkout, so anything still open was
    // treated as being with the member regardless of the delivery flag.
    return 'WITH_MEMBER';
  }
  return 'WITH_MEMBER';
}

async function run() {
  await connectDB();

  const collection = mongoose.connection.collection('borrows');
  const legacy = (await collection
    .find({ fulfilment: { $exists: false } })
    .toArray()) as unknown as LegacyBorrow[];

  console.log(`Found ${legacy.length} borrow(s) to migrate.`);
  if (legacy.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const ops = legacy.map((row) => {
    const fulfilment = deriveFulfilment(row);
    const partner = row.deliveryPersonName
      ? {
          partnerName: row.deliveryPersonName,
          partnerPhone: row.deliveryPersonPhone,
          assignedAt: row.deliveryAssignedAt,
        }
      : undefined;

    const isReturnLeg = row.deliveryType === 'PICKUP' || row.returnRequested;

    const set: Record<string, unknown> = {
      status: row.status === 'RETURNED' ? 'RETURNED' : 'ACTIVE',
      fulfilment,
      delivery: !isReturnLeg && partner ? partner : {},
      pickup: isReturnLeg && partner ? partner : {},
    };

    // Everything open and not still inbound is, by the old model's own
    // reckoning, already with the member — so give it a delivery timestamp.
    if (fulfilment !== 'PREPARING' && fulfilment !== 'OUT_FOR_DELIVERY') {
      set.deliveredAt = row.issueDate ?? new Date();
      (set.delivery as Record<string, unknown>) = {
        ...(set.delivery as Record<string, unknown>),
        completedAt: row.issueDate ?? new Date(),
      };
    }

    if (row.status === 'RETURNED' && row.returnDate) {
      (set.pickup as Record<string, unknown>) = {
        ...(set.pickup as Record<string, unknown>),
        completedAt: row.returnDate,
      };
    }

    // Keep the boolean in step with the new fulfilment value.
    set.returnRequested = fulfilment === 'RETURN_REQUESTED' || fulfilment === 'PICKUP_SCHEDULED';

    return {
      updateOne: {
        filter: { _id: row._id },
        update: {
          $set: set,
          $unset: {
            deliveryStatus: '',
            deliveryType: '',
            deliveryPersonName: '',
            deliveryPersonPhone: '',
            deliveryAssignedAt: '',
          },
        },
      },
    };
  });

  const result = await collection.bulkWrite(ops);
  console.log(`Migrated ${result.modifiedCount} borrow(s).`);

  const byState = await collection
    .aggregate([{ $group: { _id: { status: '$status', fulfilment: '$fulfilment' }, n: { $sum: 1 } } }])
    .toArray();
  console.table(byState.map((r) => ({ ...r._id, count: r.n })));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
