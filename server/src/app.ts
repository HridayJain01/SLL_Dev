import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import bookRoutes from './routes/book.routes.js';
import categoryRoutes from './routes/category.routes.js';
import seriesRoutes from './routes/series.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import borrowRoutes from './routes/borrow.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Behind Vercel's proxy the client IP arrives in X-Forwarded-For; without this
// express-rate-limit refuses to key on it and rejects the request.
app.set('trust proxy', 1);

// CLIENT_URL may hold several comma-separated origins. Trailing slashes are
// stripped because an Origin header never carries one, and a stray slash in the
// environment variable would silently stop every origin check from matching.
const configuredOrigins = (process.env.CLIENT_URL ?? '')
	.split(',')
	.map((value) => value.trim().replace(/\/+$/, ''))
	.filter(Boolean);

const allowedOrigins = new Set([
	...configuredOrigins,
	'http://localhost:5173',
	'http://127.0.0.1:5173',
]);

// Outside production, also accept loopback and private-network origins so the dev
// server is usable from other devices on the same Wi-Fi (see client/vite.config.ts).
const devOrigin =
	/^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[::1\])(:\d+)?$/;

/**
 * When the site and the API share a domain — the Vercel deployment — the browser
 * still sends an Origin header on state-changing requests, and that origin is by
 * definition the host being called. Accepting it keeps every deployment URL
 * (production, previews, custom domains) working without listing each one.
 */
function isSameOrigin(origin: string, host: string | undefined): boolean {
	if (!host) return false;
	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}

const corsOptions: cors.CorsOptions = {
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(
	cors((req, callback) => {
		const origin = req.headers.origin;

		// Non-browser callers (curl, health checks, server-to-server) send no Origin.
		const permitted =
			!origin ||
			allowedOrigins.has(origin) ||
			isSameOrigin(origin, req.headers.host) ||
			(process.env.NODE_ENV !== 'production' && devOrigin.test(origin));

		if (permitted) return callback(null, { ...corsOptions, origin: true });

		console.warn(`[cors] blocked origin "${origin}" for host "${req.headers.host}"`);
		return callback(
			Object.assign(new Error('Origin not allowed by CORS'), { statusCode: 403 })
		);
	})
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());

// Throttle auth endpoints to blunt brute-force / credential-stuffing attempts.
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many attempts, please try again later.' },
});

// Cheap liveness probe — also confirms the API is reachable after a deploy.
app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok', env: process.env.NODE_ENV ?? 'development' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

export default app;
