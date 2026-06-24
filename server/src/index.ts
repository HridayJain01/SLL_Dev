import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `\nPort ${PORT} is already in use. Another process is likely still running.\n` +
            `Free it with:  lsof -nP -iTCP:${PORT} -sTCP:LISTEN   then  kill <PID>\n`
        );
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });

    const shutdown = (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
      // Force-exit if connections don't drain in time
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  });
