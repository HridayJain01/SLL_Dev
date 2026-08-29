import mongoose from 'mongoose';

/**
 * Serverless platforms (Vercel) reuse a warm Node process across invocations but
 * can also run many of them in parallel, so the connection promise is cached on
 * `globalThis` to avoid opening a new pool on every request.
 */
declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnection: Promise<typeof mongoose> | undefined;
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!global.__mongooseConnection) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');

    global.__mongooseConnection = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log('MongoDB connected');
        return m;
      })
      .catch((err) => {
        // Drop the cached promise so the next request retries instead of
        // resolving the same rejection forever.
        global.__mongooseConnection = undefined;
        throw err;
      });
  }

  return global.__mongooseConnection;
}
