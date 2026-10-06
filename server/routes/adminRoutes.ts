import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { verifyToken, verifyAdmin } from '../middleware/auth';

const router = Router();

// Strict RBAC Guard: Every route under /api/admin requires JWT authentication + Admin role
router.use(verifyToken, verifyAdmin);

// User Account Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/flag', adminController.flagUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// System Updates & Global Notifications Broadcasting
router.post('/announcements', adminController.createAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// Global Food Database Management (CRUD)
router.post('/food', adminController.addFoodItem);
router.put('/food/:id', adminController.updateFoodItem);
router.delete('/food/:id', adminController.deleteFoodItem);

// Admin Telemetry & Health
router.get('/stats', adminController.getSystemStats);

export default router;
