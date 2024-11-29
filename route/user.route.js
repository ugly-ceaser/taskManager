import express from 'express';
const router = express.Router();
import { getProfile, updateProfile, deleteAccount } from '../controller/user.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

// Protect all routes
router.use(authMiddleware);

// User routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.delete('/account', deleteAccount);

export default router;
