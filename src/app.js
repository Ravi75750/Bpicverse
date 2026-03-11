import 'dotenv/config';
import express, { json } from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import imageRoutes from './routes/imageRoutes.js';

const app = express();

// Request logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if the origin matches the allowed origin (handle potential trailing slash in env var)
        const cleanAllowed = allowedOrigin.replace(/\/$/, "");
        const cleanOrigin = origin.replace(/\/$/, "");

        if (cleanAllowed === cleanOrigin || cleanAllowed === "*") {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}. Allowed: ${cleanAllowed}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);

app.get('/', (req, res) => {
    res.send('PicVerse API is running...');
});

export default app;
