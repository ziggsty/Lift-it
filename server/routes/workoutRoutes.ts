import { Router } from 'express';
import { workoutController } from '../controllers/workoutController';
import { verifyToken, verifyRole } from '../middleware/auth';

const router = Router();

// All workout endpoints require registered user or admin JWT
router.use(verifyToken, verifyRole(['registered', 'admin']));

// Core workout endpoints
router.get('/', workoutController.getWorkouts);
router.post('/', workoutController.logWorkout);
router.post('/sessions', workoutController.logSession);
router.get('/sessions', workoutController.getSessions);
router.delete('/sessions/:id', workoutController.deleteSession);

// Progressive overload endpoints (Strict Rule: tied to individual exercise program)
router.get('/progression', workoutController.getProgression);
router.get('/progressive-challenge', workoutController.getProgressiveChallenge);

// Pop-up history endpoint with PR detection and Brzycki 1RM
router.get('/history', workoutController.getHistory);

// Remove workout log
router.delete('/:id', workoutController.deleteWorkout);

export default router;
