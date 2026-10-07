/**
 * Mongoose Schema Design for "Lift It" - SystemAnnouncement Model
 * Allows admins to broadcast global alerts or dispatch targeted notifications
 * to specific users across the platform.
 */

export const AnnouncementMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncementDocument extends Document {
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetType: 'all' | 'specific';
  targetUserIds: string[];
  targetUserEmails?: string[];
  createdByEmail: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: 140,
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    targetType: {
      type: String,
      enum: ['all', 'specific'],
      default: 'all',
      index: true,
    },
    targetUserIds: {
      type: [String],
      default: [],
      index: true,
    },
    targetUserEmails: {
      type: [String],
      default: [],
    },
    createdByEmail: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AnnouncementSchema.index({ active: 1, createdAt: -1 });
AnnouncementSchema.index({ targetType: 1, active: 1 });

export const Announcement = mongoose.model<IAnnouncementDocument>('Announcement', AnnouncementSchema);
`;
