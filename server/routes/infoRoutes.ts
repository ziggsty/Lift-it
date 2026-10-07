import { Router } from 'express';
import { infoController } from '../controllers/infoController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Public static platform info (history, vision, core goals)
router.get('/info', infoController.getStaticInfo);

// Active system announcements / notifications (uses optionalAuth to recognize logged-in user)
router.get('/notifications', optionalAuth, infoController.getAnnouncements);

export default router;
