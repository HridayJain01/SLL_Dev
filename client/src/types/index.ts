export interface IChildProfile {
  _id: string;
  name: string;
  ageMin: number;
  ageMax: number;
}

export interface ISavedAddress {
  _id: string;
  label: string;
  line: string;
  isDefault: boolean;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  children?: IChildProfile[];
  addresses?: ISavedAddress[];
  /** Set while the member has paused their own account. */
  deactivatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  iconEmoji?: string;
}

export interface IBookImage {
  url: string;
  publicId: string;
}

export interface ISeries {
  _id: string | null;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  bookCount: number;
  ageGroupMin: number;
  ageGroupMax: number;
  /** True when an admin has created a managed Series record (with cover/description). */
  managed: boolean;
}

export interface IBook {
  _id: string;
  title: string;
  description: string;
  coverImage?: string;
  /** Cloudinary id of `coverImage`; set alongside it on legacy records. */
  cloudinaryPublicId?: string;
  images?: IBookImage[];
  createdAt?: string;
  updatedAt?: string;
  ageGroupMin: number;
  ageGroupMax: number;
  categoryId: string | ICategory;
  planAccess: ('LITTLE_READER' | 'STAR_READER' | 'WONDER_BUNDLE' | 'NORMAL' | 'PREMIUM')[];
  totalCopies: number;
  activeBorrowCount?: number;
  availableCopies?: number;
  // Catalogue metadata
  kind?: 'book' | 'puzzle';
  shelfCode?: string;
  box?: string;
  type?: string;
  series?: { name: string; index: number } | null;
  author?: string | null;
  numPages?: number;
  coverType?: 'Hardcover' | 'Softcover';
  readingAge?: string;
  readingLevel?: 'Easy' | 'Medium' | 'Hard';
  keywords?: string[];
  material?: string;
  pieceCount?: number;
}

export interface IMembership {
  _id: string;
  userId: string;
  plan: 'LITTLE_READER' | 'STAR_READER' | 'WONDER_BUNDLE' | 'NORMAL' | 'PREMIUM';
  durationMonths: 1 | 3 | 6 | 12;
  startDate: string;
  endDate: string;
  booksPerCycle: number;
  monthlyBookLimit?: number | null;
  monthlyPuzzleLimit?: number | null;
  monthlyTotalLimit?: number | null;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
}

/** Where a loan is on its journey. Mirrors the server's `BorrowFulfilment`. */
export type BorrowFulfilment =
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'WITH_MEMBER'
  | 'RETURN_REQUESTED'
  | 'PICKUP_SCHEDULED'
  | 'COLLECTED';

/** One partner handover — outbound or return. */
export interface IBorrowLeg {
  partnerName?: string;
  partnerPhone?: string;
  eta?: string;
  assignedAt?: string;
  completedAt?: string;
}

export interface IBorrow {
  _id: string;
  userId: string | IUser;
  bookId: string | IBook;
  /** When the order was placed. Borrows in one order share this exactly. */
  issueDate: string;
  /** When it reached the member. Absent until delivery is confirmed. */
  deliveredAt?: string;
  /** Absent until delivered — the loan clock starts at handover, not checkout. */
  dueDate?: string;
  returnDate?: string;
  returnRequested?: boolean;
  returnRequestedAt?: string;
  cycleMonth: number;
  cycleYear: number;
  /** Only "is the copy back?". Overdue is derived from `dueDate`, not stored. */
  status: 'ACTIVE' | 'RETURNED';
  fulfilment: BorrowFulfilment;
  delivery?: IBorrowLeg;
  pickup?: IBorrowLeg;
}

export interface INotification {
  _id: string;
  userId: string;
  type: 'DUE_REMINDER' | 'MEMBERSHIP_EXPIRY' | 'BOOK_ASSIGNED' | 'DELIVERY_ASSIGNED' | 'ORDER_RETURNED' | 'GENERAL';
  message: string;
  isRead: boolean;
  createdAt: string;
}
