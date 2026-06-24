export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
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
  images?: IBookImage[];
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

export interface IBorrow {
  _id: string;
  userId: string | IUser;
  bookId: string | IBook;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  returnRequested?: boolean;
  returnRequestedAt?: string;
  cycleMonth: number;
  cycleYear: number;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  deliveryStatus?: 'UNASSIGNED' | 'ASSIGNED' | 'COMPLETED';
  deliveryType?: 'DELIVERY' | 'PICKUP';
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  deliveryAssignedAt?: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: 'DUE_REMINDER' | 'MEMBERSHIP_EXPIRY' | 'BOOK_ASSIGNED' | 'DELIVERY_ASSIGNED' | 'ORDER_RETURNED' | 'GENERAL';
  message: string;
  isRead: boolean;
  createdAt: string;
}
