import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

/** A child on the account — drives the age-based recommendations. */
export interface IChildProfile {
  name: string;
  ageMin: number;
  ageMax: number;
}

/** A delivery address saved on the account. */
export interface ISavedAddress {
  label: string;
  line: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  /**
   * Absent on accounts that only ever signed in with Google. Anything reading
   * this must cope with it being undefined — see `comparePassword`.
   */
  password?: string;
  /** Google's stable subject id, set once the account is linked. */
  googleId?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  children: Types.DocumentArray<IChildProfile>;
  addresses: Types.DocumentArray<ISavedAddress>;
  /** Set when the member pauses their own account from My Account. */
  deactivatedAt?: Date | null;
  /** Books the member hearted. Also feeds the "N members wishlisted" count on a book. */
  wishlist: Types.ObjectId[];
  /** Books picked for the next order, not yet checked out. */
  box: Types.ObjectId[];
  /** Conflict token for concurrent orders — see the schema field. */
  orderSeq: number;
  /** SHA-256 of the emailed reset token. See the schema field. */
  resetTokenHash?: string | null;
  resetTokenExpires?: Date | null;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const ChildProfileSchema = new Schema<IChildProfile>({
  name:   { type: String, required: true, trim: true },
  ageMin: { type: Number, required: true, min: 0, max: 18 },
  ageMax: { type: Number, required: true, min: 0, max: 18 },
});

const SavedAddressSchema = new Schema<ISavedAddress>({
  label:     { type: String, required: true, trim: true },
  line:      { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true },
    // Not required: a Google-only account never sets one. The login route
    // rejects password attempts against these rather than comparing to nothing.
    password:  { type: String, minlength: 6 },
    // `sparse` so the unique index only covers accounts that actually have one;
    // without it every password-only account would collide on null.
    googleId:  { type: String, unique: true, sparse: true },
    phone:     { type: String },
    avatarUrl: { type: String },
    role:      { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    status:    { type: String, enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], default: 'PENDING' },
    children:  { type: [ChildProfileSchema], default: [] },
    addresses: { type: [SavedAddressSchema], default: [] },
    deactivatedAt: { type: Date, default: null },
    // Kept on the account, not just the browser, so they follow the member
    // across devices and never leak to whoever signs in next on a shared one.
    // `select: false` keeps them out of the user object sent at every login.
    wishlist:  { type: [{ type: Schema.Types.ObjectId, ref: 'Book' }], default: [], select: false, index: true },
    box:       { type: [{ type: Schema.Types.ObjectId, ref: 'Book' }], default: [], select: false },
    /**
     * The same conflict token as `Book.orderSeq`, for the other half of the race:
     * monthly quota is counted per member, so a double-tapped Submit races against
     * itself. Both orders write this one document, so only one survives.
     */
    orderSeq:  { type: Number, default: 0 },
    /**
     * Only the *hash* of the reset token is stored. The raw token exists in the
     * member's inbox and nowhere else, so a leaked database dump cannot be used
     * to seize accounts. `select: false` keeps it out of every ordinary query.
     */
    resetTokenHash:    { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/**
 * False for an account with no password rather than throwing — bcrypt.compare
 * rejects on an undefined hash, which would surface as a 500 on the login route
 * the moment a Google-only member typed their email into the password form.
 */
UserSchema.methods.comparePassword = function (candidate: string) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

/**
 * Why an account may not hold a session, or null when it may.
 *
 * Lives on the model rather than in a controller because both ends need it: the
 * login routes reject at sign-in, and `protect` re-checks on every request so a
 * member suspended *after* signing in loses their session immediately instead of
 * keeping it until the 7-day token expires.
 *
 * `deactivatedAt` is deliberately not grounds for blocking. That is a self-service
 * pause, and the member reactivates through `POST /api/users/me/reactivate` — which
 * is itself behind `protect`, so blocking here would strand them. The pause already
 * suspends their membership, which is what actually stops new orders.
 */
export function blockedReason(status: string): string | null {
  if (status === 'PENDING') return 'Account pending admin approval';
  if (status === 'SUSPENDED') return 'Account suspended';
  return null;
}

export default mongoose.model<IUser>('User', UserSchema);
