import mongoose from 'mongoose';
import 'dotenv/config';
import Image from './src/models/Image.js';

const checkImages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/picverse');
        console.log('Connected to MongoDB');

        const images = await Image.find().limit(10);
        if (images.length === 0) {
            console.log('No images found');
        } else {
            console.log(JSON.stringify(images, null, 2));
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkImages();
