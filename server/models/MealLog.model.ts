/**
 * Mongoose Schema Design for "Lift It" - MealLog Model
 * Tracks macronutrient distribution (calories, protein, fiber, carbs, fats)
 * and meal categories per registered user.
 */

export const MealLogMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IMealLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  mealName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinGrams: number;
  fiberGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  notes?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MealLogSchema = new Schema<IMealLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Meal log must be linked to a registered user'],
      index: true,
    },
    mealName: {
      type: String,
      required: [true, 'Meal name or description is required'],
      trim: true,
      maxlength: [120, 'Meal name cannot exceed 120 characters'],
    },
    mealType: {
      type: String,
      enum: {
        values: ['breakfast', 'lunch', 'dinner', 'snack'],
        message: '{VALUE} is not a valid meal category',
      },
      default: 'lunch',
      index: true,
    },
    calories: {
      type: Number,
      required: [true, 'Calorie amount is required'],
      min: [0, 'Calories cannot be negative'],
    },
    proteinGrams: {
      type: Number,
      required: [true, 'Protein is required (grams)'],
      min: [0, 'Protein cannot be negative'],
    },
    fiberGrams: {
      type: Number,
      required: [true, 'Fiber is required (grams)'],
      min: [0, 'Fiber cannot be negative'],
      default: 0,
    },
    carbsGrams: {
      type: Number,
      required: [true, 'Carbohydrates is required (grams)'],
      min: [0, 'Carbohydrates cannot be negative'],
    },
    fatsGrams: {
      type: Number,
      required: [true, 'Fats is required (grams)'],
      min: [0, 'Fats cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed aggregation indexes for daily macro totals
MealLogSchema.index({ userId: 1, timestamp: -1 });
MealLogSchema.index({ userId: 1, mealType: 1, timestamp: -1 });

export const MealLog = mongoose.model<IMealLogDocument>('MealLog', MealLogSchema);
`;
