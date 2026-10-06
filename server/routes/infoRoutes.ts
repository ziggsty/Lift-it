import { Router } from 'express';
import { infoController } from '../controllers/infoController';

const router = Router();

// Public static platform info (history, vision, core goals)
router.get('/info', infoController.getStaticInfo);

// Active system announcements / notifications
router.get('/notifications', infoController.getAnnouncements);

export default router;
