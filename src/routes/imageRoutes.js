import express from 'express';
import multer from 'multer';
import {
    createImage,
    getImages,
    getImageById,
    removeImage,
    incrementDownload,
    reindexColors,
    updateImageKeywords,
    reindexKeywords,
    autoTagImage,
} from '../controllers/imageController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer storage for buffer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
            cb(null, true);
        } else {
            cb(new Error('Only jpg, png, and webp files are allowed'), false);
        }
    },
});

router.route('/').get(getImages).post(protect, admin, upload.single('image'), createImage);
router.route('/:id').get(getImageById).delete(protect, admin, removeImage);
router.put('/:id/download', incrementDownload);
router.put('/:id/keywords', protect, admin, updateImageKeywords);
router.put('/:id/auto-tag', protect, admin, autoTagImage);
router.post('/reindex-colors', protect, admin, reindexColors);
router.post('/reindex-keywords', protect, admin, reindexKeywords);

export default router;
