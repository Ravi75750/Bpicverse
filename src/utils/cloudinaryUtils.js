import { v2 } from 'cloudinary';

v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (file) => {
    try {
        const result = await v2.uploader.upload(file, {
            folder: 'picverse',
            colors: true,
        });
        return result;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

export const deleteImage = async (publicId) => {
    try {
        const result = await v2.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error('Cloudinary deletion failed');
    }
};

export const getImageDetails = async (publicId) => {
    try {
        const result = await v2.api.resource(publicId, { colors: true });
        return result;
    } catch (error) {
        console.error('Cloudinary API Error:', error);
        throw new Error(`Failed to fetch image details: ${error.message}`);
    }
};
