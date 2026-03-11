import 'dotenv/config';
import express, { json } from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import imageRoutes from './routes/imageRoutes.js';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);

app.get('/', (req, res) => {
    res.send('PicVerse API is running...');
});

export default app;
