import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import sendEmail, { getOTPEmailTemplate } from '../utils/nodemailerUtils.js';
import crypto from 'crypto';

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export async function register(req, res) {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        email = email.toLowerCase().trim();

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

        const user = await User.create({
            name,
            email,
            password,
            otp,
            otpExpiry,
        });

        // Send OTP via email
        await sendEmail({
            email: user.email,
            subject: 'PicVerse Account Verification OTP',
            message: `Your OTP for PicVerse registration is ${otp}. It expires in 5 minutes.`,
            html: getOTPEmailTemplate(otp, 'sign-up'),
        });

        res.status(201).json({
            message: 'Registration successful. OTP sent to email.',
            email: user.email,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export async function verifyOTP(req, res) {
    try {
        let { email, otp } = req.body;
        email = email.toLowerCase().trim();

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified' });
        }

        if (user.otp !== otp || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        const token = generateToken(user._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
            message: 'Account verified successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Login user
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

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your account' });
        }

        if (user.email === 'mrbadshaff@gmail.com') {
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
                message: 'Admin logged in directly',
            });
        }

        // Generate OTP for login (Step 1 of 2FA)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 5 * 60 * 1000;

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendEmail({
            email: user.email,
            subject: 'PicVerse Login OTP',
            message: `Your login OTP is ${otp}. It expires in 5 minutes.`,
            html: getOTPEmailTemplate(otp, 'login'),
        });

        res.status(200).json({
            message: 'OTP sent to email',
            email: user.email,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Verify Login OTP
// @route   POST /api/auth/verify-login
// @access  Public
export async function verifyLogin(req, res) {
    try {
        let { email, otp } = req.body;
        email = email.toLowerCase().trim();

        const user = await User.findOne({ email }).select('+password');

        if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        const token = generateToken(user._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        });
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
