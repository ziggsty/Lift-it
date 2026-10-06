import { Router } from 'express';
import { authController } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Public auth endpoints
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected user profile endpoints
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, authController.updateProfile);

export default router;
