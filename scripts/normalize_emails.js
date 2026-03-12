import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../src/models/User.js';

const normalizeEmails = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users to normalize.`);

        for (const user of users) {
            const normalizedEmail = user.email.toLowerCase().trim();
            if (user.email !== normalizedEmail) {
                console.log(`Normalizing: ${user.email} -> ${normalizedEmail}`);
                user.email = normalizedEmail;
                await user.save();
            }
        }

        console.log('Email normalization complete.');
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

normalizeEmails();
