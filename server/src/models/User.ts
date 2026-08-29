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

export default mongoose.model<IUser>('User', UserSchema);
