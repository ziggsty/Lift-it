/**
 * Mongoose Schema Design for "Lift It" - User Model
 * Includes Role-Based Access Control (RBAC), password hashing hooks,
 * virtual properties, and indexing for enterprise scalability.
 */

export const UserMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'guest' | 'registered' | 'admin';
  isFlagged: boolean;
  flagReason?: string;
  profile: {
    heightCm?: number;
    weightKg?: number;
    activityLevel?: 'sedentary' | 'moderate' | 'active' | 'athlete';
    targetCalorieGoal?: number;
    targetProteinGoal?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['guest', 'registered', 'admin'],
        message: '{VALUE} is not a supported role',
      },
      default: 'registered',
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    flagReason: {
      type: String,
      default: '',
    },
    profile: {
      heightCm: { type: Number, min: 50, max: 280 },
      weightKg: { type: Number, min: 20, max: 400 },
      activityLevel: {
        type: String,
        enum: ['sedentary', 'moderate', 'active', 'athlete'],
        default: 'moderate',
      },
      targetCalorieGoal: { type: Number, default: 2400 },
      targetProteinGoal: { type: Number, default: 160 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: Hash password with bcrypt before persisting
UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Instance method to safely verify incoming user passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
`;
