import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
export async function login(req, res) {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase().trim();

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.email === 'mrbadshaff@gmail.com' || user.role === 'admin') {
            const token = generateToken(user._id);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token,
                message: 'Admin logged in',
            });
        }

        return res.status(401).json({ message: 'Only admin can login.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get all users
// @route   GET /api/auth
// @access  Private/Admin
export async function getUsers(req, res) {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
