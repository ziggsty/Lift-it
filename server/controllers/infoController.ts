import { Request, Response } from 'express';
import { db } from '../db/database';

export const infoController = {
  /**
   * Public static website information
   * Accessible by all (Guests, Registered, Admins)
   */
  getStaticInfo(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      app: 'Lift It - Fitness & Nutrition Platform',
      version: '2.4.0',
      vision: 'Democratize scientifically-grounded progressive overload training and precision macronutrient tracking for athletes and lifters worldwide.',
      history: 'Founded in 2024 by competitive powerlifters and biomechanics researchers who grew tired of fragmented spreadsheets and ad-cluttered tracking apps. Lift It was engineered as a high-throughput, secure backend system that computes real-time 1RM trajectories, automated overload jumps, and exact macro energy balance.',
      coreGoals: [
        {
          title: 'Algorithmic Progressive Overload',
          description: 'Eliminate training plateaus by continuously adapting load, volume density, and rep ranges based on rolling workout fatigue indicators.',
        },
        {
          title: 'Macronutrient Accuracy',
          description: 'Provide an uncompromised global nutritional database with zero marketing fluff—just clean energy and macronutrient profiles.',
        },
        {
          title: 'Role-Based Privacy & Integrity',
          description: 'Strict multi-tier architecture ensuring privacy for user training telemetry and strict moderation governance by platform administrators.',
        },
      ],
      architecturalHighlights: [
        'JWT-based RBAC authentication with bcrypt credential hashing',
        'Tiered field projections safeguarding nutritional analytics',
        'Brzycki formula one-rep max estimation engine',
        'Automated workload fatigue and progression algorithm',
      ],
    });
  },

  /**
   * Get active system announcements / global notifications
   */
  getAnnouncements(_req: Request, res: Response): void {
    const announcements = db.getAnnouncements(true);
    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  },
};
