import express from 'express';
import { register, verifyOTP, login, verifyLogin, getUsers } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/verify-login', verifyLogin);
router.get('/', protect, admin, getUsers);

export default router;
