import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
import Image from './src/models/Image.js';

const checkImages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/picverse');
        console.log('Connected to MongoDB');

        const images = await Image.find().limit(5);
        if (images.length === 0) {
            console.log('No images found');
        } else {
            images.forEach(img => {
                const publicId = `picverse/${img.imageUrl.split('/').pop().split('.')[0]}`;
                console.log(`ID: ${img._id}`);
                console.log(`URL: ${img.imageUrl}`);
                console.log(`Extracted Public ID: ${publicId}`);
                console.log('---');
            });
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkImages();
