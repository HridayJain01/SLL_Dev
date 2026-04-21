import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import bookRoutes from './routes/book.routes.js';
import categoryRoutes from './routes/category.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import borrowRoutes from './routes/borrow.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = new Set([
	process.env.CLIENT_URL,
	'http://localhost:5173',
	'http://127.0.0.1:5173',
].filter(Boolean) as string[]);

app.use(
	cors({
		origin(origin, callback) {
			// Allow non-browser requests and configured browser origins.
			if (!origin || allowedOrigins.has(origin)) return callback(null, true);
			return callback(new Error('Origin not allowed by CORS'));
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

export default app;
