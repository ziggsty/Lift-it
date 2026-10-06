import { Router } from 'express';
import { mealController } from '../controllers/mealController';
import { verifyToken, verifyRole } from '../middleware/auth';

const router = Router();

// Meal tracking requires registered user or admin JWT
router.use(verifyToken, verifyRole(['registered', 'admin']));

// Core meal tracking endpoints
router.get('/', mealController.getMeals);
router.post('/', mealController.logMeal);

// Meal history endpoint formatted for pop-up displays
router.get('/history', mealController.getHistory);

// Daily macronutrient summary & calorie distribution progress
router.get('/summary', mealController.getDailySummary);

// Delete meal log
router.delete('/:id', mealController.deleteMeal);

export default router;
