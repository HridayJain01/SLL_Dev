# 📚 Star Learners Library App — Full Product Requirements Document (PRD)

> **For AI IDE / Codex:** This document is a complete, end-to-end specification for a MERN stack application. Build the entire project following every section in order. Do not skip any section. Where implementation details are unspecified, use best practices for a production-grade MongoDB + Express + React + Node.js application.

---

## 0. PROJECT OVERVIEW

| Field | Value |
|---|---|
| **Project Name** | Star Learners Library |
| **Type** | Full-stack MERN Web Application (monorepo) |
| **Primary Users** | Parents (on behalf of children), Admin/Library Owner |
| **Core Purpose** | Children's book lending library with membership tiers, WhatsApp-based payments, and admin management |
| **Tech Stack** | MongoDB, Express.js, React 18 + Vite 5, Node.js, TypeScript throughout |

---

## 1. TECH STACK & ARCHITECTURE

### Monorepo Structure
Two workspaces managed via npm workspaces:
- `client/` — React + Vite frontend
- `server/` — Express.js + Node.js backend

### Frontend (`client/`)
- **Framework:** React 18 with Vite 5
- **Language:** TypeScript (strict mode)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS v3
- **UI Components:** shadcn/ui (manual Vite install)
- **State Management:** Zustand
- **Server State:** TanStack Query v5 (React Query)
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
- **HTTP Client:** Axios (pointed at Express API, `withCredentials: true`)
- **Auth:** JWT stored in `httpOnly` cookie; auth state in Zustand

### Backend (`server/`)
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript (run with `tsx` in dev, compiled for prod)
- **Database:** MongoDB via Mongoose ODM
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs` for password hashing
- **File Upload:** Multer → Cloudinary (book cover images)
- **Validation:** Zod on all request bodies
- **Environment:** dotenv

### Deployment
- **Frontend:** Vercel or Netlify (static build from `client/dist`)
- **Backend:** Railway or Render (Node.js)
- **Database:** MongoDB Atlas (cloud)
- **Media:** Cloudinary (free tier)

---

## 2. ROOT MONOREPO SETUP

### Root `package.json`
```json
{
  "name": "star-learners-library",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=server\" \"npm run dev --workspace=client\"",
    "build": "npm run build --workspace=client && npm run build --workspace=server",
    "seed": "npm run seed --workspace=server"
  },
  "devDependencies": {
    "concurrently": "^8.x"
  }
}
```

---

## 3. DATABASE SCHEMA (Mongoose — `server/src/models/`)

### User Model (`User.ts`)
```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true },
    password:  { type: String, required: true, minlength: 6 },
    phone:     { type: String },
    avatarUrl: { type: String },
    role:      { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    status:    { type: String, enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], default: 'PENDING' },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
```

### Membership Model (`Membership.ts`)
```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMembership extends Document {
  userId: Types.ObjectId;
  plan: 'NORMAL' | 'PREMIUM';
  durationMonths: 1 | 3 | 6 | 12;
  startDate: Date;
  endDate: Date;
  booksPerCycle: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  paymentProof?: string;
}

const MembershipSchema = new Schema<IMembership>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan:           { type: String, enum: ['NORMAL', 'PREMIUM'], required: true },
    durationMonths: { type: Number, enum: [1, 3, 6, 12], required: true },
    startDate:      { type: Date, required: true },
    endDate:        { type: Date, required: true },
    booksPerCycle:  { type: Number, required: true },
    status:         { type: String, enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED'], default: 'ACTIVE' },
    paymentProof:   { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IMembership>('Membership', MembershipSchema);
```

### Category Model (`Category.ts`)
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  iconEmoji?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name:      { type: String, required: true, unique: true },
    slug:      { type: String, required: true, unique: true, lowercase: true },
    iconEmoji: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', CategorySchema);
```

### Book Model (`Book.ts`)
```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBook extends Document {
  title: string;
  description: string;
  coverImage?: string;
  cloudinaryPublicId?: string;
  ageGroupMin: number;
  ageGroupMax: number;
  categoryId: Types.ObjectId;
  planAccess: ('NORMAL' | 'PREMIUM')[];
  totalCopies: number;
}

const BookSchema = new Schema<IBook>(
  {
    title:              { type: String, required: true },
    description:        { type: String, required: true },
    coverImage:         { type: String },
    cloudinaryPublicId: { type: String },
    ageGroupMin:        { type: Number, required: true },
    ageGroupMax:        { type: Number, required: true },
    categoryId:         { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    planAccess:         [{ type: String, enum: ['NORMAL', 'PREMIUM'] }],
    totalCopies:        { type: Number, default: 1 },
  },
  { timestamps: true }
);

BookSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IBook>('Book', BookSchema);
```

### Borrow Model (`Borrow.ts`)
```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBorrow extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  cycleMonth: number;
  cycleYear: number;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
}

const BorrowSchema = new Schema<IBorrow>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId:     { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    issueDate:  { type: Date, default: Date.now },
    dueDate:    { type: Date, required: true },
    returnDate: { type: Date },
    cycleMonth: { type: Number, required: true },
    cycleYear:  { type: Number, required: true },
    status:     { type: String, enum: ['ACTIVE', 'RETURNED', 'OVERDUE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export default mongoose.model<IBorrow>('Borrow', BorrowSchema);
```

### BookPreference Model (`BookPreference.ts`)
```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBookPreference extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
}

const BookPreferenceSchema = new Schema<IBookPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  },
  { timestamps: true }
);

BookPreferenceSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export default mongoose.model<IBookPreference>('BookPreference', BookPreferenceSchema);
```

### Notification Model (`Notification.ts`)
```typescript
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'DUE_REMINDER' | 'MEMBERSHIP_EXPIRY' | 'BOOK_ASSIGNED' | 'GENERAL';
  message: string;
  isRead: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:    { type: String, enum: ['DUE_REMINDER', 'MEMBERSHIP_EXPIRY', 'BOOK_ASSIGNED', 'GENERAL'], required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
```

---

## 4. FOLDER STRUCTURE

```
star-learners-library/
├── package.json                            # Root monorepo
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── src/
│       ├── index.ts                        # Entry point
│       ├── app.ts                          # Express setup, middleware, routes
│       ├── config/
│       │   ├── db.ts                       # MongoDB connection
│       │   ├── cloudinary.ts               # Cloudinary config
│       │   └── constants.ts                # Plan pricing, quota, etc.
│       ├── models/
│       │   ├── User.ts
│       │   ├── Membership.ts
│       │   ├── Category.ts
│       │   ├── Book.ts
│       │   ├── Borrow.ts
│       │   ├── BookPreference.ts
│       │   └── Notification.ts
│       ├── middleware/
│       │   ├── auth.ts                     # JWT verify
│       │   ├── requireAdmin.ts             # Role guard
│       │   ├── upload.ts                   # Multer config
│       │   └── errorHandler.ts             # Global error handler
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── user.routes.ts
│       │   ├── book.routes.ts
│       │   ├── category.routes.ts
│       │   ├── membership.routes.ts
│       │   ├── borrow.routes.ts
│       │   └── notification.routes.ts
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── user.controller.ts
│       │   ├── book.controller.ts
│       │   ├── category.controller.ts
│       │   ├── membership.controller.ts
│       │   ├── borrow.controller.ts
│       │   └── notification.controller.ts
│       ├── lib/
│       │   ├── jwt.ts
│       │   └── whatsapp.ts
│       └── seed/
│           └── seed.ts
│
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                         # All React Router routes
│       ├── index.css                       # Tailwind directives + CSS vars
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── Library.tsx
│       │   ├── BookDetails.tsx
│       │   ├── Membership.tsx
│       │   ├── About.tsx
│       │   ├── FAQ.tsx
│       │   ├── Login.tsx
│       │   ├── Signup.tsx
│       │   ├── dashboard/
│       │   │   ├── DashboardLayout.tsx
│       │   │   ├── DashboardOverview.tsx
│       │   │   ├── MyBooks.tsx
│       │   │   ├── Preferences.tsx
│       │   │   └── DashboardNotifications.tsx
│       │   └── admin/
│       │       ├── AdminLayout.tsx
│       │       ├── AdminOverview.tsx
│       │       ├── AdminUsers.tsx
│       │       ├── AdminUserDetail.tsx
│       │       ├── AdminBooks.tsx
│       │       ├── AdminBookForm.tsx
│       │       ├── AdminCategories.tsx
│       │       ├── AdminInventory.tsx
│       │       └── AdminNotifications.tsx
│       ├── components/
│       │   ├── ui/                         # shadcn/ui components
│       │   ├── layout/
│       │   │   ├── Navbar.tsx
│       │   │   ├── Footer.tsx
│       │   │   ├── DashboardSidebar.tsx
│       │   │   └── AdminSidebar.tsx
│       │   ├── home/
│       │   │   ├── HeroSection.tsx
│       │   │   ├── FeaturedBooks.tsx
│       │   │   ├── CategorySection.tsx
│       │   │   ├── HowItWorks.tsx
│       │   │   ├── MembershipHighlight.tsx
│       │   │   └── Testimonials.tsx
│       │   ├── library/
│       │   │   ├── BookCard.tsx
│       │   │   ├── BookGrid.tsx
│       │   │   ├── BookFilters.tsx
│       │   │   └── BookSearch.tsx
│       │   ├── book/
│       │   │   ├── BookDetail.tsx
│       │   │   └── SimilarBooks.tsx
│       │   ├── membership/
│       │   │   ├── PlanCard.tsx
│       │   │   └── PlanComparison.tsx
│       │   ├── dashboard/
│       │   │   ├── MembershipCard.tsx
│       │   │   ├── BookQuota.tsx
│       │   │   ├── CurrentBooks.tsx
│       │   │   └── NotificationList.tsx
│       │   └── admin/
│       │       ├── UserTable.tsx
│       │       ├── BookForm.tsx
│       │       ├── InventoryTable.tsx
│       │       └── StatsCards.tsx
│       ├── store/
│       │   ├── authStore.ts
│       │   └── uiStore.ts
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useBooks.ts
│       │   ├── useMembership.ts
│       │   └── useBorrows.ts
│       ├── lib/
│       │   ├── axios.ts
│       │   ├── queryClient.ts
│       │   ├── utils.ts
│       │   └── whatsapp.ts
│       ├── types/
│       │   └── index.ts
│       └── guards/
│           ├── ProtectedRoute.tsx
│           └── AdminRoute.tsx
```

---

## 5. SERVER CORE FILES

### `server/src/index.ts`
```typescript
import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
```

### `server/src/app.ts`
```typescript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import bookRoutes from './routes/book.routes';
import categoryRoutes from './routes/category.routes';
import membershipRoutes from './routes/membership.routes';
import borrowRoutes from './routes/borrow.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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
```

### `server/src/config/db.ts`
```typescript
import mongoose from 'mongoose';

export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('MongoDB connected');
}
```

### `server/src/middleware/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request { user?: any; }

export async function protect(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
```

### `server/src/middleware/requireAdmin.ts`
```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
  next();
}
```

### `server/src/lib/jwt.ts`
```typescript
import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

export function setCookieToken(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
```

---

## 6. API ROUTES

### Auth (`/api/auth`)
```
POST /api/auth/signup           → Register (name, email, password, phone)
POST /api/auth/login            → Login → set httpOnly JWT cookie
POST /api/auth/logout           → Clear cookie
GET  /api/auth/me               → Get current user [protect]
POST /api/auth/change-password  → [protect]
```

### Users (`/api/users`)
```
GET  /api/users                 → List users, filter by status/role [admin]
GET  /api/users/:id             → User + membership + borrows [admin]
PUT  /api/users/:id/status      → Set ACTIVE / SUSPENDED [admin]
PUT  /api/users/:id/role        → Promote to ADMIN [admin]
```

### Books (`/api/books`)
```
GET    /api/books               → List (query: category, ageMin, ageMax, plan, search, available, page, limit) [public]
GET    /api/books/:id           → Single book + similar [public]
POST   /api/books               → Create with image upload [admin]
PUT    /api/books/:id           → Update [admin]
DELETE /api/books/:id           → Delete + remove Cloudinary image [admin]
```

### Categories (`/api/categories`)
```
GET    /api/categories          → List all [public]
POST   /api/categories          → Create [admin]
PUT    /api/categories/:id      → Update [admin]
DELETE /api/categories/:id      → Delete [admin]
```

### Memberships (`/api/memberships`)
```
GET  /api/memberships/me        → My membership [protect]
POST /api/memberships           → Assign to user [admin]
PUT  /api/memberships/:id       → Update status [admin]
```

### Borrows (`/api/borrows`)
```
GET  /api/borrows               → All [admin] or own [user] [protect]
POST /api/borrows               → Assign book to user [admin]
PUT  /api/borrows/:id/return    → Mark returned [admin]
GET  /api/borrows/overdue       → List overdue [admin]
```

### Notifications (`/api/notifications`)
```
GET  /api/notifications/me              → My notifications [protect]
PUT  /api/notifications/:id/read        → Mark one read [protect]
PUT  /api/notifications/read-all        → Mark all read [protect]
POST /api/notifications/send-reminders  → Trigger due-date reminders [admin]
POST /api/notifications/send-custom     → Custom notification to user [admin]
```

---

## 7. CONTROLLER LOGIC

### Auth Controller

**Signup flow:**
1. Validate with Zod (name, email, password, phone)
2. Check email not already taken
3. Create User (bcrypt hash happens in pre-save hook)
4. Sign JWT, set `httpOnly` cookie via `setCookieToken`
5. Return user object without password

**Login flow:**
1. Find user by email; if not found → 401
2. `user.comparePassword(password)`; if fail → 401
3. If `status === 'PENDING'` → 403: "Account pending admin approval"
4. If `status === 'SUSPENDED'` → 403: "Account suspended"
5. Sign JWT, set cookie, return user

### Book Controller

**List Books:** Build Mongoose query from `req.query`. For availability, use aggregation `$lookup` on Borrows to compute `activeBorrows` per book, then `$addFields` for `availableCopies = totalCopies - activeBorrows`. Paginate with `.skip().limit()`.

**Create Book:**
1. Multer processes `multipart/form-data`
2. Upload image buffer to Cloudinary via `upload_stream`
3. Save `secure_url` as `coverImage`, `public_id` as `cloudinaryPublicId`
4. Create Book document

**Delete Book:**
1. If `cloudinaryPublicId` exists → `cloudinary.uploader.destroy(id)`
2. Delete Book, related Borrows, related BookPreferences

### Borrow Controller

**Assign Book (admin only):**
1. Get user's active, non-expired Membership
2. Count active borrows for that user in current `cycleMonth` + `cycleYear`
3. If count >= `membership.booksPerCycle` → 400: "Monthly quota exhausted"
4. Count active borrows for the book; if >= `book.totalCopies` → 400: "Book not available"
5. Create Borrow (`dueDate = issueDate + BORROW_DURATION_DAYS`)
6. Create `BOOK_ASSIGNED` Notification for the user

**Mark Returned:**
1. Set `returnDate = Date.now()`, `status = 'RETURNED'`
2. Quota frees automatically (count-based)

### Notification Controller

**Send Reminders (admin):**
1. Find all Borrows where `status = 'ACTIVE'` and `dueDate <= now + REMINDER_DAYS_BEFORE days`
2. For each, create a `DUE_REMINDER` Notification for that user

---

## 8. CLIENT CORE FILES

### `client/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
```

### `client/src/lib/axios.ts`
```typescript
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### `client/src/store/authStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/types';

interface AuthState {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    { name: 'auth-storage' }
  )
);
```

### `client/src/App.tsx`
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/guards/ProtectedRoute';
import AdminRoute from '@/guards/AdminRoute';
// ... all page imports

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/:bookId" element={<BookDetails />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard — logged-in users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="my-books" element={<MyBooks />} />
            <Route path="preferences" element={<Preferences />} />
            <Route path="notifications" element={<DashboardNotifications />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="books" element={<AdminBooks />} />
            <Route path="books/new" element={<AdminBookForm />} />
            <Route path="books/:bookId/edit" element={<AdminBookForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Route Guards
```typescript
// guards/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// guards/AdminRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
export default function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
```

---

## 9. PAGE SPECIFICATIONS

### 9.1 HOME PAGE (`/`)
Sections in order:
1. **Navbar** — Logo "📚 Star Learners Library", links (Home, Library, Membership, About, FAQ), Login/Signup or user avatar. Sticky with backdrop blur.
2. **Hero** — Headline: "Books That Grow With Your Child". CTAs: "Browse Library" → `/library`, "Get Membership" → WhatsApp link. Warm amber-to-orange gradient background.
3. **Membership Highlight** — Normal vs Premium side-by-side cards. Book quota, starting price, "Most Popular" badge on Premium.
4. **Featured Books Carousel** — Horizontal scroll of 6–8 book cards (title, age badge, category badge, cover).
5. **Category Section** — Emoji chips grid linking to `/library?category=slug`.
6. **How It Works** — 4-step stepper: Choose Plan → Pay via WhatsApp → Admin Activates → Borrow & Enjoy.
7. **Testimonials** — 3 parent testimonial cards with star ratings.
8. **Footer** — Nav links, WhatsApp number, email, copyright.

### 9.2 LIBRARY PAGE (`/library`)
- Debounced search bar (300ms)
- Filters: Age Group dropdown, Category multi-select, Availability toggle, Plan Access
- Book grid: 3 cols desktop / 2 tablet / 1 mobile, 12 per page, pagination
- BookCard: cover image, title, age badge, category badge, availability pill (green/red), plan badge, "View Details" button
- If user on NORMAL plan → PREMIUM books show lock icon + "Upgrade to view" tooltip

### 9.3 BOOK DETAILS PAGE (`/library/:bookId`)
- Two-column (image | details) on desktop, stacked on mobile
- Full description, all badges, availability pill
- "Add to Preference List" button
- "Borrow / Request" button — disabled with inline reason if: not logged in / quota full / wrong plan / unavailable
- Similar Books horizontal scroll (same category, 4 books)

### 9.4 MEMBERSHIP PAGE (`/membership`)
- Plan comparison table (Normal vs Premium features)
- Pricing cards — Normal Plan (5 Books/Month):

| Duration | Price | Savings |
|---|---|---|
| 1 Month | ₹450 | — |
| 3 Months | ₹1,200 | Save ₹150 |
| 6 Months | ₹2,200 | Save ₹500 |
| 12 Months | ₹4,200 | Save ₹1,200 |

- Pricing cards — Premium Plan (8 Books+Puzzles/Month):

| Duration | Price | Savings |
|---|---|---|
| 1 Month | ₹720 | — |
| 3 Months | ₹2,000 | Save ₹160 |
| 6 Months | ₹3,800 | Save ₹520 |
| 12 Months | ₹7,200 | — |

- Each card has "Buy via WhatsApp" button with pre-filled `wa.me` message
- Payment instructions (4 steps)

### 9.5 ABOUT PAGE (`/about`)
- Hero, Mission & Vision cards, Founder story, "Why Choose Us" (4 feature cards), Process steps

### 9.6 FAQ PAGE (`/faq`)
- shadcn/ui Accordion — 10 questions (see Section 11)

### 9.7 AUTH PAGES
- **Login:** email + password → `POST /api/auth/login` → store user in Zustand → redirect `/dashboard`
- **Signup:** name, email, phone, password, confirm password → `POST /api/auth/signup` → show pending approval message

### 9.8 USER DASHBOARD (`/dashboard`)
- **Overview:** Membership card (plan, dates, status), quota progress ring (X/5 or X/8), current books with due countdowns, latest 3 notifications
- **My Books:** Tabs Current / History. Table: title, issue date, due date, status, return date
- **Preferences:** Grid of saved books with "Remove" button
- **Notifications:** Full list, mark read, unread count badge on navbar bell icon

### 9.9 ADMIN PANEL (`/admin`)
- **Overview:** Stats cards (users, active members, total books, books out, overdue), recent activity, quick-action buttons
- **Users:** Filterable table (All/Pending/Active/Suspended). Approve modal: select plan + duration + start date → creates Membership, sets status ACTIVE. Suspend / View borrows actions.
- **Books:** Table with thumbnail. Add/Edit form with Cloudinary image upload. Delete with confirmation dialog.
- **Categories:** Inline add/edit/delete table.
- **Inventory:** Table (book, borrower, issue date, due date, days remaining, status). Row colors: green = on time, yellow = due ≤3 days, red = overdue. Assign Book modal. Mark Returned button.
- **Notifications:** "Send Due Reminders" button, custom notification composer (select user + message), full sent notifications list.

---

## 10. BUSINESS CONSTANTS (`server/src/config/constants.ts`)

```typescript
export const PLAN_QUOTA = { NORMAL: 5, PREMIUM: 8 } as const;

export const PLAN_PRICING = {
  NORMAL:  { 1: 450,  3: 1200, 6: 2200,  12: 4200 },
  PREMIUM: { 1: 720,  3: 2000, 6: 3800,  12: 7200 },
} as const;

export const PLAN_SAVINGS = {
  NORMAL:  { 1: 0, 3: 150, 6: 500, 12: 1200 },
  PREMIUM: { 1: 0, 3: 160, 6: 520, 12: 0 },
} as const;

export const BORROW_DURATION_DAYS = 15;
export const REMINDER_DAYS_BEFORE = 3;
export const WHATSAPP_NUMBER = '919XXXXXXXXX'; // replace with real number
```

---

## 11. FAQ QUESTIONS

1. How does borrowing work?
2. How is my membership activated?
3. What happens if I return books late?
4. How are return reminders sent?
5. Can I upgrade from Normal to Premium?
6. How many books can I have at a time?
7. Are puzzles included in all plans?
8. How do I return books — pickup or drop-off?
9. What if a book is damaged during my use?
10. Can I renew my membership before it expires?

---

## 12. WHATSAPP HELPERS (`client/src/lib/whatsapp.ts`)

```typescript
const WA = import.meta.env.VITE_WHATSAPP_NUMBER;

export const getMembershipWhatsAppLink = (plan: string, months: number, price: number) => {
  const msg = encodeURIComponent(
    `Hi! I'd like to buy the ${plan} Plan (${months} month(s)) for ₹${price}. Please share payment details.`
  );
  return `https://wa.me/${WA}?text=${msg}`;
};

export const getReminderWhatsAppLink = (phone: string, title: string, due: string) => {
  const msg = encodeURIComponent(
    `Hi! Reminder: "${title}" is due for return on ${due}. Please arrange to return it. Thank you!`
  );
  return `https://wa.me/${phone}?text=${msg}`;
};
```

---

## 13. SEED DATA (`server/src/seed/seed.ts`)

Run with: `npx tsx src/seed/seed.ts`

**Categories:**
- 📖 Storybooks (`storybooks`)
- 🔢 Educational (`educational`)
- 🧩 Puzzles (`puzzles`)
- 🎨 Activity Books (`activity-books`)
- 🦁 Animal Books (`animal-books`)
- 🌍 Science & Nature (`science-nature`)

**12 Sample Books:** Mix of NORMAL/PREMIUM planAccess, age groups 2–4, 4–6, 6–8, 8–12, spread across categories. Use `https://placehold.co/300x400?text=Title` for cover images.

**Admin User:**
- Name: Admin
- Email: `admin@starlearners.com`
- Password: `Admin@123`
- Role: `ADMIN`, Status: `ACTIVE`

---

## 14. UI / DESIGN SYSTEM

### Color Palette (`client/src/index.css`)
```css
:root {
  --color-primary:      #F59E0B;
  --color-primary-dark: #D97706;
  --color-secondary:    #3B82F6;
  --color-accent:       #10B981;
  --color-danger:       #EF4444;
  --color-bg:           #FFFBF0;
  --color-surface:      #FFFFFF;
  --color-text:         #1F2937;
  --color-muted:        #6B7280;
}
```

### Typography
- Headings: `'Nunito', sans-serif` — import from Google Fonts in `index.html`
- Body: `'Inter', sans-serif`

### Component Library
- `shadcn/ui`: Button, Card, Dialog, Drawer, Table, Badge, Input, Select, Tabs, Accordion, Skeleton, Toast
- `sonner` for all toasts
- `lucide-react` for all icons

### Responsive
- Mobile-first. Library grid: 1 col → 2 col (`sm:`) → 3 col (`lg:`)

---

## 15. SERVER `package.json`

```json
{
  "name": "server",
  "scripts": {
    "dev":   "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed":  "tsx src/seed/seed.ts"
  },
  "dependencies": {
    "express": "^4.x",
    "mongoose": "^8.x",
    "bcryptjs": "^2.x",
    "jsonwebtoken": "^9.x",
    "cloudinary": "^2.x",
    "multer": "^1.x",
    "dotenv": "^16.x",
    "cors": "^2.x",
    "cookie-parser": "^1.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "tsx": "^4.x",
    "typescript": "^5.x",
    "@types/express": "^4.x",
    "@types/bcryptjs": "^2.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/multer": "^1.x",
    "@types/cors": "^2.x",
    "@types/cookie-parser": "^1.x",
    "@types/node": "^20.x"
  }
}
```

## 16. CLIENT `package.json`

```json
{
  "name": "client",
  "scripts": {
    "dev":     "vite",
    "build":   "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "zustand": "^4.x",
    "@tanstack/react-query": "^5.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",
    "framer-motion": "^11.x",
    "lucide-react": "^0.x",
    "sonner": "^1.x",
    "date-fns": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "class-variance-authority": "^0.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x"
  }
}
```

---

## 17. IMPLEMENTATION ORDER

Build strictly in this sequence:

1. **Monorepo scaffold** — root `package.json`, `client/` via `npm create vite@latest`, `server/` TypeScript setup
2. **MongoDB + Mongoose models** — all 7 models in `server/src/models/`
3. **Express app** — `app.ts`, `index.ts`, DB connect, CORS, cookie-parser, global error handler
4. **Auth API + middleware** — signup, login, logout, `/me`, JWT protect middleware
5. **Remaining API routes** — categories → books (with Cloudinary) → users → memberships → borrows → notifications
6. **Seed script** — run and verify in MongoDB Atlas
7. **Client: Axios + Zustand + TanStack Query setup**
8. **Client: Auth pages** — Login, Signup, route guards
9. **Client: Layout components** — Navbar, Footer, DashboardSidebar, AdminSidebar
10. **Client: Public pages** — Home, Library, BookDetails, Membership, About, FAQ
11. **Client: User Dashboard** — Overview, My Books, Preferences, Notifications
12. **Client: Admin Panel** — Overview, Users, Books, Categories, Inventory, Notifications
13. **Polish** — Loading skeletons, error boundaries, Framer Motion transitions, mobile responsiveness, sonner toasts

---

## 18. NOTES FOR AI IDE

- **Pure MERN.** MongoDB + Express + React (Vite) + Node. No Next.js, no Prisma, no Supabase.
- **JWT in `httpOnly` cookies only.** Never localStorage. Always `withCredentials: true` on Axios.
- **Mongoose for all DB access.** No raw MongoDB driver calls.
- **Book availability is computed dynamically** — `totalCopies - count(active borrows for that book)`. Never a stored boolean field.
- **Admin approval is manual** — admin reads WhatsApp payment message, then activates via panel. No payment gateway integration needed.
- **WhatsApp is outbound only** via `wa.me` deep links. No WhatsApp API or webhooks.
- **All images** go to Cloudinary. Store `secure_url` + `public_id`. Delete from Cloudinary when book is deleted.
- **Vite proxy** (`/api → http://localhost:5000`) handles CORS in development. In production, set `VITE_API_URL` to the deployed Express URL.
- **TypeScript strict mode** on both client and server. Minimize use of `any`.
- **All request bodies** validated with Zod in Express controllers.
- **All forms** use React Hook Form + Zod with inline field-level error messages.
- **All async content** shows `shadcn/ui Skeleton` while loading.
- **Mobile responsive** on every single page. Test at 375px, 768px, 1280px.
- Use `sonner` for all success/error toasts.
- Use `date-fns` for all date formatting and calculations.
- Wrap Dashboard and Admin layouts in React `ErrorBoundary` components.
