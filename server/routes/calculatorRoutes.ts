import { Router } from 'express';
import { calculatorController } from '../controllers/calculatorController';

const router = Router();

// Public BMI and caloric guidelines endpoint (No JWT required)
router.post('/bmi', calculatorController.calculateBmi);

export default router;
