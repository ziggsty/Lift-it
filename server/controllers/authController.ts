import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { generateToken } from '../middleware/auth';
import { UserRole } from '../types';

export const authController = {
  /**
   * Register a new user
   * Default role transitions from guest to 'registered'
   */
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, profile } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          error: 'Name, email, and password are required fields.',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long.',
          code: 'PASSWORD_TOO_SHORT',
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid email address.',
          code: 'INVALID_EMAIL_FORMAT',
        });
        return;
      }

      // Check if user already exists
      const existingUser = await db.findUserByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please log in.',
          code: 'USER_ALREADY_EXISTS',
        });
        return;
      }

      // Hash password using bcrypt with salt factor 10
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Default role upon signup is 'registered'
      const role: UserRole = 'registered';

      const newUser = await db.createUser({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        isFlagged: false,
        profile: {
          heightCm: profile?.heightCm || 175,
          weightKg: profile?.weightKg || 75,
          activityLevel: profile?.activityLevel || 'moderate',
          targetCalorieGoal: profile?.targetCalorieGoal || 2400,
          targetProteinGoal: profile?.targetProteinGoal || 150,
        },
      });

      const token = generateToken(newUser);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully. User tier upgraded to Registered.',
        data: {
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            isFlagged: newUser.isFlagged,
            profile: newUser.profile,
            createdAt: newUser.createdAt,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error during account registration.',
        details: error.message,
      });
    }
  },

  /**
   * Log in an existing user
   * Returns signed JWT on successful bcrypt comparison
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required.',
          code: 'CREDENTIALS_MISSING',
        });
        return;
      }

      const user = await db.findUserByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      if (user.isFlagged) {
        res.status(403).json({
          success: false,
          error: `Account suspended: ${user.flagReason || 'Violated platform policies'}. Please contact support or admin.`,
          code: 'ACCOUNT_SUSPENDED',
        });
        return;
      }

      const token = generateToken(user);

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isFlagged: user.isFlagged,
            profile: user.profile,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error during authentication.',
        details: error.message,
      });
    }
  },

  /**
   * Get current authenticated user profile
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = await db.findUserById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isFlagged: user.isFlagged,
          profile: user.profile,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Update personal profile goals
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { name, heightCm, weightKg, activityLevel, targetCalorieGoal, targetProteinGoal } = req.body;
      const currentUser = await db.findUserById(userId);
      if (!currentUser) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const updated = await db.updateUser(userId, {
        name: name !== undefined ? name : currentUser.name,
        profile: {
          ...currentUser.profile,
          ...(heightCm !== undefined && { heightCm: Number(heightCm) }),
          ...(weightKg !== undefined && { weightKg: Number(weightKg) }),
          ...(activityLevel !== undefined && { activityLevel }),
          ...(targetCalorieGoal !== undefined && { targetCalorieGoal: Number(targetCalorieGoal) }),
          ...(targetProteinGoal !== undefined && { targetProteinGoal: Number(targetProteinGoal) }),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
