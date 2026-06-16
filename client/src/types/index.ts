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

export interface IBook {
  _id: string;
  title: string;
  description: string;
  coverImage?: string;
  images?: string[];
  ageGroupMin: number;
  ageGroupMax: number;
  categoryId: string | ICategory;
  planAccess: ('NORMAL' | 'PREMIUM')[];
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
  plan: 'NORMAL' | 'PREMIUM';
  durationMonths: 1 | 3 | 6 | 12;
  startDate: string;
  endDate: string;
  booksPerCycle: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
}

export interface IBorrow {
  _id: string;
  userId: string | IUser;
  bookId: string | IBook;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  cycleMonth: number;
  cycleYear: number;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
}

export interface INotification {
  _id: string;
  userId: string;
  type: 'DUE_REMINDER' | 'MEMBERSHIP_EXPIRY' | 'BOOK_ASSIGNED' | 'GENERAL';
  message: string;
  isRead: boolean;
  createdAt: string;
}
