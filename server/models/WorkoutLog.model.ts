/**
 * Mongoose Schema Design for "Lift It" - WorkoutLog Model
 * Tracks individual workout exercises, sets, reps, weight lifted, and duration.
 * Includes calculated 1RM (Brzycki formula) and volume indexing.
 */

export const WorkoutLogMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkoutLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  exerciseName: string;
  sets: number;
  reps: number;
  weightLiftedKg: number;
  durationMinutes: number; // time consumed
  notes?: string;
  rpe?: number; // Rate of Perceived Exertion (1 to 10)
  totalVolumeKg: number;
  calculated1RM: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutLogSchema = new Schema<IWorkoutLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workout log must belong to a user'],
      index: true,
    },
    exerciseName: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
      index: true,
    },
    sets: {
      type: Number,
      required: [true, 'Sets count is required'],
      min: [1, 'Sets must be at least 1'],
      max: [50, 'Sets cannot exceed 50'],
    },
    reps: {
      type: Number,
      required: [true, 'Reps count is required'],
      min: [1, 'Reps must be at least 1'],
      max: [200, 'Reps cannot exceed 200'],
    },
    weightLiftedKg: {
      type: Number,
      required: [true, 'Weight lifted is required (kg)'],
      min: [0, 'Weight cannot be negative'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Time consumed (duration in minutes) is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    rpe: {
      type: Number,
      min: 1,
      max: 10,
      default: 8,
    },
    totalVolumeKg: {
      type: Number,
    },
    calculated1RM: {
      type: Number,
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

// Compound index for high-speed chronological queries per user and exercise
WorkoutLogSchema.index({ userId: 1, timestamp: -1 });
WorkoutLogSchema.index({ userId: 1, exerciseName: 1, timestamp: -1 });

// Pre-save hook: auto-compute total volume and estimated 1-Rep Max (Brzycki formula)
WorkoutLogSchema.pre<IWorkoutLogDocument>('save', function (next) {
  this.totalVolumeKg = this.sets * this.reps * this.weightLiftedKg;
  if (this.reps === 1) {
    this.calculated1RM = this.weightLiftedKg;
  } else if (this.reps > 1 && this.reps < 37) {
    // Brzycki formula: Weight / (1.0278 - 0.0278 * reps)
    this.calculated1RM = Math.round((this.weightLiftedKg / (1.0278 - 0.0278 * this.reps)) * 10) / 10;
  } else {
    this.calculated1RM = this.weightLiftedKg;
  }
  next();
});

export const WorkoutLog = mongoose.model<IWorkoutLogDocument>('WorkoutLog', WorkoutLogSchema);
`;
