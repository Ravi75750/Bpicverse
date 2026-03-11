import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
import Image from '../src/models/Image.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cleanupImages = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const images = await Image.find();
        console.log(`Found ${images.length} images to delete.`);

        if (images.length === 0) {
            console.log('No images found in the database.');
            process.exit(0);
        }

        let deletedCount = 0;
        let errorCount = 0;

        for (const image of images) {
            try {
                // Extract public ID from Cloudinary URL
                // Assuming URL format: https://res.cloudinary.com/cloud_name/image/upload/v123456789/folder/public_id.jpg
                const urlParts = image.imageUrl.split('/');
                const fileNameWithExt = urlParts[urlParts.length - 1];
                const publicIdWithoutFolder = fileNameWithExt.split('.')[0];
                const publicId = `picverse/${publicIdWithoutFolder}`;

                console.log(`Deleting image from Cloudinary: ${publicId}`);
                const cloudResult = await cloudinary.uploader.destroy(publicId);

                if (cloudResult.result === 'ok' || cloudResult.result === 'not found') {
                    console.log(`Cloudinary deletion (${cloudResult.result}): ${publicId}`);

                    console.log(`Deleting image from Database: ${image._id}`);
                    await image.deleteOne();
                    deletedCount++;
                } else {
                    console.error(`Failed to delete from Cloudinary: ${publicId}`, cloudResult);
                    errorCount++;
                }
            } catch (err) {
                console.error(`Error deleting image ${image._id}:`, err.message);
                errorCount++;
            }
        }

        console.log('\n--- Cleanup Summary ---');
        console.log(`Total images processed: ${images.length}`);
        console.log(`Successfully deleted: ${deletedCount}`);
        console.log(`Errors encountered: ${errorCount}`);
        console.log('------------------------');

        await mongoose.connection.close();
        console.log('MongoDB connection closed.');

    } catch (error) {
        console.error('Cleanup Script Error:', error);
        process.exit(1);
    }
};

cleanupImages();
