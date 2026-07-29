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
  password: string;
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
    password:  { type: String, required: true, minlength: 6 },
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
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
