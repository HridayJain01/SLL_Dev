import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';

/**
 * A replica set, not a standalone `mongod`: `requestBooks` places orders inside a
 * transaction, and transactions are a replica-set feature. A standalone would fail
 * every order-placement test for reasons unrelated to what they assert.
 */
let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  process.env.JWT_SECRET ??= 'test-secret-not-a-real-one';
  process.env.NODE_ENV = 'test';

  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
});

afterEach(async () => {
  // Wipe between tests so each one states its own preconditions.
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});
