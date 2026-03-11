import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const result = await User.updateOne(
            { email: 'mrbadshaff@gmail.com' },
            {
                $set: {
                    password: hashedPassword,
                    role: 'admin',
                    isVerified: true
                }
            }
        );

        if (result.matchedCount > 0) {
            console.log('Admin password updated to admin123');
        } else {
            console.log('Admin user not found');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetAdmin();
