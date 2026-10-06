import { Router } from 'express';
import { foodController } from '../controllers/foodController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Food queries: Accessible to guests (basic calories) and registered users (deep macros)
router.get('/', optionalAuth, foodController.getFoodItems);
router.post('/import-foods', foodController.importFoods);
router.post('/import', foodController.importFoods);
router.get('/:id', optionalAuth, foodController.getFoodById);

export default router;
