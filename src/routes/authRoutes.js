import express from 'express';
import { login, getUsers } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/', protect, admin, getUsers);

export default router;
