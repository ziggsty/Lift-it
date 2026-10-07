import { Request, Response } from 'express';
import { db } from '../db/database';
import { UserRole } from '../types';

export const adminController = {
  /**
   * Get all user accounts with activity stats
   */
  async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await db.getAllUsers();
      const allWorkouts = await db.getAllWorkouts();
      const allMeals = await db.getAllMeals();

      const enrichedUsers = users.map((u) => {
        const userWorkouts = allWorkouts.filter((w) => w.userId === u.id);
        const userMeals = allMeals.filter((m) => m.userId === u.id);
        const totalVolume = userWorkouts.reduce((acc, curr) => acc + (curr.totalVolumeKg || 0), 0);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isFlagged: !!u.isFlagged,
          flagReason: u.flagReason || '',
          profile: u.profile,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          stats: {
            workoutsLogged: userWorkouts.length,
            mealsLogged: userMeals.length,
            totalVolumeKg: Math.round(totalVolume),
          },
        };
      });

      res.status(200).json({
        success: true,
        count: enrichedUsers.length,
        data: enrichedUsers,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Flag or unflag a user account (e.g. for violations or abuse)
   */
  async flagUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isFlagged, reason } = req.body;

      if (isFlagged === undefined) {
        res.status(400).json({ success: false, error: 'isFlagged (boolean) is required in request body.' });
        return;
      }

      const user = await db.findUserById(id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User account not found.' });
        return;
      }

      // Prevent admin from flagging themselves
      if (id === req.user?.userId && isFlagged) {
        res.status(400).json({ success: false, error: 'Admins cannot flag their own account.' });
        return;
      }

      const updated = await db.updateUser(id, {
        isFlagged: Boolean(isFlagged),
        flagReason: isFlagged ? (reason || 'Flagged by system administrator') : '',
      });

      res.status(200).json({
        success: true,
        message: isFlagged ? `User ${user.email} has been suspended/flagged.` : `User ${user.email} flag removed.`,
        data: {
          id: updated?.id,
          email: updated?.email,
          isFlagged: updated?.isFlagged,
          flagReason: updated?.flagReason,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Update user account role or attributes
   */
  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role, name } = req.body;

      const validRoles: UserRole[] = ['guest', 'registered', 'admin'];
      if (role && !validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          error: `Invalid role specified. Supported roles: ${validRoles.join(', ')}`,
        });
        return;
      }

      const user = await db.findUserById(id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User account not found.' });
        return;
      }

      const updated = await db.updateUser(id, {
        ...(role && { role }),
        ...(name && { name: name.trim() }),
      });

      res.status(200).json({
        success: true,
        message: 'User account updated successfully.',
        data: {
          id: updated?.id,
          name: updated?.name,
          email: updated?.email,
          role: updated?.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Delete user account permanently
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (id === req.user?.userId) {
        res.status(400).json({
          success: false,
          error: 'Action prohibited: Admins cannot delete their own active account.',
        });
        return;
      }

      const deleted = await db.deleteUser(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'User account not found or already removed.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User account and associated training & meal data deleted successfully.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get all system announcements / broadcasts for admin audit and management
   */
  async getAnnouncements(_req: Request, res: Response): Promise<void> {
    try {
      const announcements = db.getAnnouncements(false);
      res.status(200).json({
        success: true,
        count: announcements.length,
        data: announcements,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Push system updates: either as a global broadcast to all users
   * or as a targeted notification to specific users (e.g. selected user IDs)
   */
  async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { title, message, priority, targetType, targetUserIds } = req.body;

      if (!title || !message) {
        res.status(400).json({
          success: false,
          error: 'Title and message are required for system announcement dispatch.',
        });
        return;
      }

      const isTargeted = targetType === 'specific';
      let resolvedTargetIds: string[] = [];
      let resolvedTargetEmails: string[] = [];

      if (isTargeted) {
        if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
          res.status(400).json({
            success: false,
            error: 'Targeted notification requires selecting at least one recipient user.',
          });
          return;
        }

        resolvedTargetIds = targetUserIds.map((id: any) => String(id).trim()).filter(Boolean);
        if (resolvedTargetIds.length === 0) {
          res.status(400).json({
            success: false,
            error: 'No valid recipient user IDs provided.',
          });
          return;
        }

        // Fetch user records to store human-readable names and emails
        const allUsers = await db.getAllUsers();
        resolvedTargetEmails = allUsers
          .filter((u) => resolvedTargetIds.includes(String(u.id)) || resolvedTargetIds.includes(String(u._id)))
          .map((u) => `${u.name} (${u.email})`);
      }

      const announcement = db.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        priority: priority || 'normal',
        targetType: isTargeted ? 'specific' : 'all',
        targetUserIds: resolvedTargetIds,
        targetUserEmails: resolvedTargetEmails,
        createdByEmail: req.user?.email || 'admin@liftit.com',
        active: true,
      });

      const audienceFeedback = isTargeted
        ? `targeted notification sent to ${resolvedTargetIds.length} user(s)`
        : 'global announcement broadcasted to all users';

      res.status(201).json({
        success: true,
        message: `System ${audienceFeedback} successfully.`,
        data: announcement,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Delete or archive an announcement
   */
  async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = db.deleteAnnouncement(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Announcement not found.' });
        return;
      }

      res.status(200).json({ success: true, message: 'Announcement deleted.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Global Food Database Management: Add new food item
   */
  async addFoodItem(req: Request, res: Response): Promise<void> {
    try {
      const { name, category, servingSize, calories, proteinGrams, fiberGrams, carbsGrams, fatsGrams, sodiumMg, potassiumMg, publicNotes } = req.body;

      if (!name || !category || !servingSize || calories === undefined || proteinGrams === undefined || carbsGrams === undefined || fatsGrams === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required food parameters: name, category, servingSize, calories, proteinGrams, carbsGrams, fatsGrams.',
        });
        return;
      }

      const newItem = db.addFoodItem({
        name: name.trim(),
        category,
        servingSize: servingSize.trim(),
        calories: Number(calories),
        proteinGrams: Number(proteinGrams),
        fiberGrams: fiberGrams ? Number(fiberGrams) : 0,
        carbsGrams: Number(carbsGrams),
        fatsGrams: Number(fatsGrams),
        sodiumMg: sodiumMg ? Number(sodiumMg) : 0,
        potassiumMg: potassiumMg ? Number(potassiumMg) : 0,
        publicNotes: publicNotes ? publicNotes.trim() : '',
        isCustom: false,
        createdById: req.user?.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Global food item registered into database successfully.',
        data: newItem,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Global Food Database Management: Update food item
   */
  async updateFoodItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = db.updateFoodItem(id, updates);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Food item not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Food item updated in global database.',
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Global Food Database Management: Delete food item
   */
  async deleteFoodItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = db.deleteFoodItem(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Food item not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Food item removed from global database.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * High-level admin telemetry and system stats
   */
  async getSystemStats(_req: Request, res: Response): Promise<void> {
    try {
      const users = await db.getAllUsers();
      const workouts = await db.getAllWorkouts();
      const meals = await db.getAllMeals();
      const foods = db.getFoodItems();
      const announcements = db.getAnnouncements(false);

      const totalVolumeKg = workouts.reduce((acc, curr) => acc + (curr.totalVolumeKg || 0), 0);
      const flaggedCount = users.filter((u) => u.isFlagged).length;

      res.status(200).json({
        success: true,
        data: {
          usersCount: {
            total: users.length,
            registered: users.filter((u) => u.role === 'registered').length,
            admins: users.filter((u) => u.role === 'admin').length,
            flagged: flaggedCount,
          },
          telemetry: {
            totalWorkoutsLogged: workouts.length,
            totalMealsLogged: meals.length,
            totalCumulativeVolumeKg: Math.round(totalVolumeKg),
            globalFoodDatabaseItems: foods.length,
            activeAnnouncementsCount: announcements.filter((a) => a.active).length,
          },
          systemHealth: {
            status: 'operational',
            uptimeSeconds: Math.round(process.uptime()),
            memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
            nodeVersion: process.version,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
