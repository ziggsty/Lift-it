/**
 * Mongoose Schema Design for "Lift It" - SystemAnnouncement Model
 * Allows admins to broadcast global alerts and maintenance/feature notifications
 * to all registered users.
 */

export const AnnouncementMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncementDocument extends Document {
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
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

export const Announcement = mongoose.model<IAnnouncementDocument>('Announcement', AnnouncementSchema);
`;
