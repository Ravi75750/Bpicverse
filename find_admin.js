import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';

const findAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log(`Admin found: ${admin.email}`);
            // We don't know the password, so we'll update it to 'admin123' for testing if needed
            // Or just check if the user exists.
        } else {
            console.log('No admin found');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

findAdmin();
