import { Request, Response } from 'express';
import { db } from '../db/database';

export const mealController = {
  /**
   * Log a new meal with detailed nutrient breakdown
   * Requires: calories, protein, fiber, carbs, fats, mealName, mealType
   */
  async logMeal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { mealName, mealType, calories, proteinGrams, fiberGrams, carbsGrams, fatsGrams, notes, timestamp } = req.body;

      if (!mealName || calories === undefined || proteinGrams === undefined || carbsGrams === undefined || fatsGrams === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required meal parameters: mealName, calories, proteinGrams, carbsGrams, fatsGrams.',
          code: 'MEAL_PARAMS_MISSING',
        });
        return;
      }

      if (calories < 0 || proteinGrams < 0 || carbsGrams < 0 || fatsGrams < 0) {
        res.status(400).json({
          success: false,
          error: 'Nutrient values cannot be negative numbers.',
          code: 'NEGATIVE_NUTRIENTS',
        });
        return;
      }

      const meal = await db.createMeal({
        userId,
        mealName: mealName.trim(),
        mealType: mealType || 'lunch',
        calories: Number(calories),
        proteinGrams: Number(proteinGrams),
        fiberGrams: fiberGrams !== undefined ? Number(fiberGrams) : 0,
        carbsGrams: Number(carbsGrams),
        fatsGrams: Number(fatsGrams),
        notes: notes ? notes.trim() : '',
        timestamp: timestamp || new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: 'Meal logged successfully.',
        data: meal,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get meals logged by the user with optional date filter
   */
  async getMeals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { date, mealType } = req.query;
      let meals = await db.getMealsByUserId(userId);

      if (date && typeof date === 'string') {
        const targetDate = new Date(date).toISOString().split('T')[0];
        meals = meals.filter((m) => new Date(m.timestamp).toISOString().split('T')[0] === targetDate);
      }

      if (mealType && typeof mealType === 'string' && mealType !== 'all') {
        meals = meals.filter((m) => m.mealType.toLowerCase() === mealType.toLowerCase());
      }

      res.status(200).json({
        success: true,
        count: meals.length,
        data: meals,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get detailed historical meal plan logs formatted for pop-up data displays
   * Aggregates total macros, computes macro ratios, and formats timestamps
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const rawMeals = await db.getMealsByUserId(userId);

      const formattedMeals = rawMeals.map((meal) => {
        const proteinKcal = meal.proteinGrams * 4;
        const carbsKcal = meal.carbsGrams * 4;
        const fatsKcal = meal.fatsGrams * 9;
        const totalKcal = proteinKcal + carbsKcal + fatsKcal || 1;

        return {
          ...meal,
          formattedDate: new Date(meal.timestamp).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          formattedTime: new Date(meal.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          macroRatio: {
            protein: Math.round((proteinKcal / totalKcal) * 100),
            carbs: Math.round((carbsKcal / totalKcal) * 100),
            fats: Math.round((fatsKcal / totalKcal) * 100),
          },
        };
      });

      const totalCalories = rawMeals.reduce((acc, m) => acc + m.calories, 0);
      const totalProtein = rawMeals.reduce((acc, m) => acc + m.proteinGrams, 0);
      const totalCarbs = rawMeals.reduce((acc, m) => acc + m.carbsGrams, 0);
      const totalFats = rawMeals.reduce((acc, m) => acc + m.fatsGrams, 0);
      const totalFiber = rawMeals.reduce((acc, m) => acc + (m.fiberGrams || 0), 0);

      res.status(200).json({
        success: true,
        summary: {
          totalMealsLogged: rawMeals.length,
          totalCaloriesLogged: Math.round(totalCalories),
          totalProteinGrams: Math.round(totalProtein * 10) / 10,
          totalCarbsGrams: Math.round(totalCarbs * 10) / 10,
          totalFatsGrams: Math.round(totalFats * 10) / 10,
          totalFiberGrams: Math.round(totalFiber * 10) / 10,
          averageCaloriesPerMeal: rawMeals.length > 0 ? Math.round(totalCalories / rawMeals.length) : 0,
        },
        data: formattedMeals,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get daily nutrition summary & macro percentage distribution
   */
  async getDailySummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { date } = req.query;
      const targetDateStr = date && typeof date === 'string'
        ? new Date(date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const user = await db.findUserById(userId);
      const userMeals = (await db.getMealsByUserId(userId)).filter((m) => {
        return new Date(m.timestamp).toISOString().split('T')[0] === targetDateStr;
      });

      const totals = userMeals.reduce(
        (acc, m) => {
          acc.calories += m.calories;
          acc.proteinGrams += m.proteinGrams;
          acc.fiberGrams += m.fiberGrams || 0;
          acc.carbsGrams += m.carbsGrams;
          acc.fatsGrams += m.fatsGrams;
          return acc;
        },
        { calories: 0, proteinGrams: 0, fiberGrams: 0, carbsGrams: 0, fatsGrams: 0 }
      );

      // Calculate macro calorie contributions (Protein: 4 kcal/g, Carbs: 4 kcal/g, Fats: 9 kcal/g)
      const proteinKcal = totals.proteinGrams * 4;
      const carbsKcal = totals.carbsGrams * 4;
      const fatsKcal = totals.fatsGrams * 9;
      const totalMacroKcal = proteinKcal + carbsKcal + fatsKcal || 1;

      const macroPercentages = {
        protein: Math.round((proteinKcal / totalMacroKcal) * 100),
        carbs: Math.round((carbsKcal / totalMacroKcal) * 100),
        fats: Math.round((fatsKcal / totalMacroKcal) * 100),
      };

      const calorieTarget = user?.profile?.targetCalorieGoal || 2200;
      const proteinTarget = user?.profile?.targetProteinGoal || 150;

      res.status(200).json({
        success: true,
        date: targetDateStr,
        totals: {
          ...totals,
          proteinGrams: Math.round(totals.proteinGrams * 10) / 10,
          fiberGrams: Math.round(totals.fiberGrams * 10) / 10,
          carbsGrams: Math.round(totals.carbsGrams * 10) / 10,
          fatsGrams: Math.round(totals.fatsGrams * 10) / 10,
        },
        targets: {
          calories: calorieTarget,
          proteinGrams: proteinTarget,
        },
        progress: {
          caloriePercent: Math.min(100, Math.round((totals.calories / calorieTarget) * 100)),
          proteinPercent: Math.min(100, Math.round((totals.proteinGrams / proteinTarget) * 100)),
        },
        macroPercentages,
        loggedMealsCount: userMeals.length,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Delete a meal log
   */
  async deleteMeal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const deleted = await db.deleteMeal(id, userId);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Meal log not found or already deleted.' });
        return;
      }

      res.status(200).json({ success: true, message: 'Meal log removed successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
