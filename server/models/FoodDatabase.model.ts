/**
 * Mongoose Schema Design for "Lift It" - FoodDatabase Model
 * Stores global verified nutritional database items.
 * Supports RBAC Field Projection:
 *  - Public (Guest): Name, Category, Serving Size, Calories only.
 *  - Registered / Admin: Complete Macronutrients (Protein, Fiber, Carbs, Fats, Sodium, etc.).
 */

export const FoodDatabaseMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodDatabaseDocument extends Document {
  name: string;
  category: 'protein' | 'carbs' | 'fats' | 'dairy' | 'vegetable' | 'fruit' | 'beverage' | 'snack';
  servingSize: string;
  calories: number;
  proteinGrams: number;
  fiberGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  sodiumMg?: number;
  potassiumMg?: number;
  publicNotes?: string;
  isCustom: boolean;
  createdById?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FoodDatabaseSchema = new Schema<IFoodDatabaseDocument>(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['protein', 'carbs', 'fats', 'dairy', 'vegetable', 'fruit', 'beverage', 'snack'],
      required: [true, 'Food category is required'],
      index: true,
    },
    servingSize: {
      type: String,
      required: [true, 'Serving size is required (e.g., "100g", "1 scoop (30g)")'],
      trim: true,
    },
    calories: {
      type: Number,
      required: [true, 'Calorie count is required'],
      min: [0, 'Calories cannot be negative'],
    },
    // Protected nutritional fields (restricted for guest tier)
    proteinGrams: {
      type: Number,
      required: [true, 'Protein is required'],
      min: 0,
    },
    fiberGrams: {
      type: Number,
      required: [true, 'Fiber is required'],
      min: 0,
      default: 0,
    },
    carbsGrams: {
      type: Number,
      required: [true, 'Carbohydrates is required'],
      min: 0,
    },
    fatsGrams: {
      type: Number,
      required: [true, 'Fats is required'],
      min: 0,
    },
    sodiumMg: {
      type: Number,
      min: 0,
      default: 0,
    },
    potassiumMg: {
      type: Number,
      min: 0,
      default: 0,
    },
    publicNotes: {
      type: String,
      trim: true,
      default: '',
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Full text search indexing for fast food lookup
FoodDatabaseSchema.index({ name: 'text', category: 'text' });

export const FoodDatabase = mongoose.model<IFoodDatabaseDocument>('FoodDatabase', FoodDatabaseSchema);
`;
