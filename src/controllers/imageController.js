import Image from '../models/Image.js';
import { uploadImage, deleteImage as cloudDeleteImage, getImageDetails } from '../utils/cloudinaryUtils.js';

// Intelligent Keyword Mapping
const keywordMap = {
    'nature': ['outdoors', 'landscape', 'greenery', 'environment', 'scenic', 'wildlife', 'earth', 'trees', 'natural', 'wilderness'],
    'mountain': ['nature', 'peak', 'adventure', 'climbing', 'altitude', 'landscape', 'snow', 'summit', 'highlands'],
    'forest': ['nature', 'trees', 'greenery', 'woodland', 'wilderness', 'jungle', 'environment', 'foliage'],
    'sunset': ['nature', 'evening', 'sky', 'dusk', 'horizon', 'orange', 'warmth', 'sunlight', 'sunsetview'],
    'beach': ['nature', 'ocean', 'sand', 'coastal', 'summer', 'vacation', 'shore', 'waves', 'seaside'],
    'city': ['urban', 'architecture', 'cityscape', 'metropolis', 'buildings', 'street', 'downtown', 'cityview'],
    'animal': ['wildlife', 'fauna', 'creature', 'nature', 'pet', 'mammal'],
    'tech': ['technology', 'digital', 'innovation', 'gadget', 'future', 'modern', 'software', 'electronics'],
    'business': ['office', 'professional', 'work', 'corporate', 'meeting', 'team', 'finance', 'workspace'],
    'abstract': ['art', 'concept', 'creative', 'modern', 'style', 'background', 'artistic', 'graphics'],
    'minimal': ['clean', 'simple', 'minimalist', 'space', 'modern', 'elegant', 'simplicity'],
    'people': ['human', 'person', 'lifestyle', 'community', 'portrait', 'crowd', 'activity'],
    'car': ['vehicle', 'automotive', 'transport', 'speed', 'drive', 'engine', 'automobile'],
    'food': ['cuisine', 'delicious', 'healthy', 'cooking', 'meal', 'restaurant', 'culinary'],
    'night': ['dark', 'evening', 'stars', 'moonlight', 'citylights', 'nightlife', 'nightview', 'nocturnal'],
    'sky': ['atmosphere', 'clouds', 'blue', 'infinite', 'horizon', 'weather', 'celestial'],
    'water': ['liquid', 'river', 'lake', 'ocean', 'refreshing', 'blue', 'splash', 'aquatic'],
    'chair': ['furniture', 'seating', 'interior', 'comfort', 'object', 'garden', 'armchair'],
    'garden': ['nature', 'home', 'backyard', 'flowers', 'greenery', 'plants', 'outdoor', 'way', 'park', 'botanical'],
    'tree': ['nature', 'forest', 'greenery', 'woodland', 'plants', 'environment', 'jungle', 'oak', 'pine'],
    'greenery': ['nature', 'plants', 'environment', 'lush', 'garden', 'green', 'foliage'],
    'jungle': ['wildlife', 'tropical', 'forest', 'nature', 'rainforest', 'environment', 'exotic'],
    'way': ['path', 'road', 'trail', 'direction', 'journey', 'nature', 'walkway', 'track'],
    'path': ['way', 'road', 'trail', 'journey', 'nature', 'walkway', 'garden', 'park'],
    'nightview': ['night', 'nightlife', 'nightcity', 'city', 'lights', 'darkness', 'nocturnal'],
    'nightlife': ['night', 'party', 'entertainment', 'city', 'club', 'vibrant', 'social'],
    'nightcity': ['night', 'city', 'urban', 'architecture', 'nightview', 'lights', 'metropolis'],
    'park': ['nature', 'bench', 'trees', 'outdoor', 'greenery', 'garden', 'recreation', 'publicspace'],
    'bench': ['furniture', 'park', 'outdoor', 'seating', 'nature', 'wood', 'relaxation'],
    'outdoor': ['nature', 'scenic', 'environment', 'landscape', 'freshair', 'outdoors'],
    'white': ['minimal', 'clean', 'bright', 'pure', 'minimalist'],
    'blue': ['sky', 'water', 'ocean', 'calm', 'serene'],
    'red': ['vibrant', 'warm', 'passion', 'energy', 'bold'],
    'black': ['dark', 'shadow', 'elegant', 'mysterious'],
    'green': ['nature', 'greenery', 'plants', 'environment', 'fresh', 'lush', 'trees', 'forest'],
    'view': ['scenery', 'landscape', 'lookout', 'perspective', 'panorama', 'scenic'],
    'object': ['item', 'thing', 'element', 'component', 'detail']
};

const junkWords = [
    'pexels', 'pixabay', 'unsplash', 'istock', 'shutterstock', 'stock',
    'image', 'photo', 'picture', 'pic', 'hd', '4k', 'wallpaper',
    'download', 'free', 'high', 'resolution', 'www', 'com', 'org', 'net'
];

// Helper to expand keywords
const expandKeywords = (inputKeywords) => {
    const expanded = new Set();
    const cleanInput = inputKeywords.filter(kw => {
        if (!kw) return false;
        const lower = kw.toLowerCase().trim();
        // Filter out junk, numbers, and very short strings
        return !junkWords.includes(lower) &&
            isNaN(lower) &&
            lower.length > 2 &&
            !/^#[0-9a-f]{3,6}$/i.test(lower); // Filter hex colors
    });

    cleanInput.forEach(kw => {
        const lowerKw = kw.toLowerCase().trim();
        expanded.add(lowerKw);

        if (keywordMap[lowerKw]) {
            keywordMap[lowerKw].forEach(related => expanded.add(related));
        }

        // Also check if any map key is contained in the keyword
        Object.keys(keywordMap).forEach(key => {
            if (lowerKw.includes(key) || key.includes(lowerKw)) {
                keywordMap[key].forEach(related => expanded.add(related));
                expanded.add(key);
            }
        });
    });
    return Array.from(expanded);
};

// @desc    Upload image
// @route   POST /api/images
// @access  Private/Admin
export const createImage = async (req, res) => {
    try {
        const { title, description, tags, keywords } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image' });
        }

        // Convert buffer to data URI for Cloudinary
        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const uploadResponse = await uploadImage(fileStr);

        // --- Auto-Categorization Logic ---
        let autoTitle = title || req.file.originalname.split('.')[0].replace(/[_-]/g, ' ');
        let autoTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
        let inputKeywords = keywords ? keywords.split(',').map(keyword => keyword.trim().toLowerCase()) : [];

        // Auto-extract keywords from file name
        const fileName = req.file.originalname.split('.')[0];
        const extractedFromFileName = fileName
            .replace(/[_-]/g, ' ')
            .split(' ')
            .filter(word => word.trim().length > 0)
            .map(word => word.trim().toLowerCase());

        // Merge input keywords and filename extraction, excluding junk
        let combinedKeywords = Array.from(new Set([
            ...inputKeywords,
            ...extractedFromFileName,
            ...autoTitle.toLowerCase().replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/)
        ]));

        // Contextual inference for junk titles - Aggressively check for objects
        const lowerTitle = autoTitle.toLowerCase();
        const lowerTags = autoTags.map(t => t.toLowerCase());

        // If title is junk, try to infer from what we have
        if (lowerTitle.includes('pexels') || lowerTitle.includes('pixabay') || !isNaN(autoTitle.split(' ')[0])) {
            // Case 1: Greenery/Garden/Park (Bench detection)
            if (lowerTags.some(t => ['nature', 'green', 'garden', 'forest', 'trees'].includes(t))) {
                combinedKeywords.push('garden', 'trees', 'greenery', 'nature', 'outdoor', 'park', 'bench', 'chair', 'path', 'walkway', 'view', 'landscape');
            }
            // Case 2: City/Night
            if (lowerTags.some(t => ['city', 'night', 'urban', 'buildings'].includes(t))) {
                combinedKeywords.push('nightview', 'nightlife', 'nightcity', 'city', 'lights', 'architecture', 'metropolis', 'darkness');
            }
            // Case 3: Water/Beach
            if (lowerTags.some(t => ['water', 'ocean', 'beach', 'sea', 'blue'].includes(t))) {
                combinedKeywords.push('water', 'ocean', 'beach', 'waves', 'shore', 'coastal', 'summer', 'vacation', 'nature', 'scenic');
            }
        } else {
            // If not junk, still add related objects if keywords are mentioned
            if (lowerTitle.includes('bench') || lowerTitle.includes('chair') || lowerTitle.includes('garden')) {
                combinedKeywords.push('furniture', 'seating', 'park', 'outdoor', 'nature');
            }
        }

        // Expand keywords intelligently (this handles junk filtering internally now)
        const finalKeywords = expandKeywords(combinedKeywords);

        // Extract dominant colors if available
        if (uploadResponse.colors && uploadResponse.colors.length > 0) {
            const getNearestColorName = (hex) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                const baseColors = {
                    'Red': [255, 0, 0], 'Green': [0, 255, 0], 'Blue': [0, 0, 255],
                    'Yellow': [255, 255, 0], 'White': [255, 255, 255], 'Black': [0, 0, 0],
                    'Gray': [128, 128, 128], 'Brown': [165, 42, 42], 'Orange': [255, 165, 0],
                    'Purple': [128, 0, 128], 'Pink': [255, 192, 203], 'Cyan': [0, 255, 255]
                };
                let minDistance = Infinity;
                let nearestColor = 'Other';
                for (const [name, [br, bg, bb]] of Object.entries(baseColors)) {
                    const distance = Math.sqrt(Math.pow(r - br, 2) + Math.pow(g - bg, 2) + Math.pow(b - bb, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestColor = name;
                    }
                }
                return nearestColor;
            };

            const thresholds = [15, 25, 30];
            uploadResponse.colors.slice(0, 3).forEach(([hex, freq], index) => {
                if (freq < (thresholds[index] || 30)) return;
                const colorName = getNearestColorName(hex).toLowerCase();
                if (colorName !== 'other' && !autoTags.includes(colorName)) {
                    autoTags.push(colorName);
                }
                if (!autoTags.includes(hex.toLowerCase())) {
                    autoTags.push(hex.toLowerCase());
                }
            });
        }

        const newImage = new Image({
            title: autoTitle,
            description: description || `A beautiful ${autoTitle} image.`,
            imageUrl: uploadResponse.secure_url,
            tags: autoTags,
            keywords: finalKeywords,
            uploadedBy: req.user._id,
        });

        const savedImage = await newImage.save();
        res.status(201).json(savedImage);

    } catch (error) {
        console.error('Create Image Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all images with filtering and sorting
// @route   GET /api/images
// @access  Public
export const getImages = async (req, res) => {
    try {
        const { search, color, sort } = req.query;
        let query = {};
        const conditions = [];

        // Handle text search (matches title, description, tags, keywords)
        if (search) {
            // Split by space, underscore, or hyphen to handle filenames/slugs
            const searchTerms = search.split(/[\s_-]+/).filter(term => term.trim() !== '');

            if (searchTerms.length > 0) {
                // Each term must match in at least one of the fields
                const termConditions = searchTerms.map(term => ({
                    $or: [
                        { title: { $regex: term, $options: 'i' } },
                        { description: { $regex: term, $options: 'i' } },
                        { tags: { $regex: term, $options: 'i' } },
                        { keywords: { $regex: term, $options: 'i' } },
                    ]
                }));

                // Also allow literal match for the original search string (e.g., "my_image" or "nature view")
                const literalCondition = {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ]
                };

                // The overall search is EITHER all terms matching OR the literal string matching
                conditions.push({
                    $or: [
                        { $and: termConditions },
                        literalCondition
                    ]
                });
            }
        }

        // Handle color filter
        if (color && color !== 'All') {
            conditions.push({
                tags: { $in: [new RegExp(`^${color}$`, 'i')] }
            });
        }

        if (conditions.length > 0) {
            query = { $and: conditions };
        }

        let imagesQuery = Image.find(query).populate('uploadedBy', 'email');

        // Handle sorting
        if (sort === 'new') {
            imagesQuery = imagesQuery.sort({ createdAt: -1 });
        } else if (sort === 'old') {
            imagesQuery = imagesQuery.sort({ createdAt: 1 });
        }

        let images = await imagesQuery;

        // Custom Randomization (Fisher-Yates Shuffle if sort='random' or default)
        if (!sort || sort === 'random') {
            for (let i = images.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [images[i], images[j]] = [images[j], images[i]];
            }
        }

        res.status(200).json(images);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single image
// @route   GET /api/images/:id
// @access  Public
export const getImageById = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id).populate('uploadedBy', 'email');
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        res.status(200).json(image);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete image
// @route   DELETE /api/images/:id
// @access  Private/Admin
export const removeImage = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Extract public ID from Cloudinary URL (assuming format: .../picverse/public_id.extension)
        const publicId = `picverse/${image.imageUrl.split('/').pop().split('.')[0]}`;
        await cloudDeleteImage(publicId);

        await image.deleteOne();
        res.status(200).json({ message: 'Image removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Increment download count
// @route   PUT /api/images/:id/download
// @access  Public
export const incrementDownload = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        image.downloadCount += 1;
        await image.save();
        res.status(200).json({ count: image.downloadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Re-index image colors (Migration)
// @route   POST /api/images/reindex-colors
// @access  Private/Admin
// @desc    Update image keywords
// @route   PUT /api/images/:id/keywords
// @access  Private/Admin
export const updateImageKeywords = async (req, res) => {
    try {
        const { keywords } = req.body;
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        image.keywords = Array.isArray(keywords)
            ? keywords.map(k => k.trim().toLowerCase())
            : keywords.split(',').map(k => k.trim().toLowerCase());

        await image.save();
        res.status(200).json(image);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const reindexColors = async (req, res) => {
    try {
        const images = await Image.find({});
        let updatedCount = 0;

        const baseColors = {
            'Red': [255, 0, 0], 'Rose': [255, 0, 127], 'Crimson': [220, 20, 60],
            'Green': [0, 255, 0], 'Lime': [50, 205, 50], 'Forest': [34, 139, 34],
            'Blue': [0, 0, 255], 'Azure': [0, 127, 255], 'Sky': [135, 206, 235],
            'Yellow': [255, 255, 0], 'Gold': [255, 215, 0],
            'White': [255, 255, 255], 'Ivory': [255, 255, 240],
            'Black': [0, 0, 0], 'Charcoal': [54, 69, 79],
            'Gray': [128, 128, 128], 'Silver': [192, 192, 192],
            'Brown': [165, 42, 42], 'Beige': [245, 245, 220],
            'Orange': [255, 165, 0], 'Coral': [255, 127, 80],
            'Purple': [128, 0, 128], 'Magenta': [255, 0, 255], 'Violet': [238, 130, 238],
            'Pink': [255, 192, 203], 'HotPink': [255, 105, 180],
            'Cyan': [0, 255, 255], 'Turquoise': [64, 224, 208]
        };

        const getNearestColorName = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            let minDistance = Infinity;
            let nearestColor = 'Other';
            for (const [name, [br, bg, bb]] of Object.entries(baseColors)) {
                const distance = Math.sqrt(Math.pow(r - br, 2) + Math.pow(g - bg, 2) + Math.pow(b - bb, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestColor = name;
                }
            }

            const mapping = {
                'Rose': 'Red', 'Crimson': 'Red',
                'Lime': 'Green', 'Forest': 'Green',
                'Azure': 'Blue', 'Sky': 'Blue',
                'Gold': 'Yellow',
                'Ivory': 'White',
                'Charcoal': 'Black',
                'Silver': 'Gray',
                'Beige': 'Brown',
                'Coral': 'Orange',
                'Magenta': 'Purple', 'Violet': 'Purple',
                'HotPink': 'Pink',
                'Turquoise': 'Cyan'
            };

            return mapping[nearestColor] || nearestColor;
        };

        for (const image of images) {
            try {
                // Extract public ID from Cloudinary URL
                const publicId = `picverse/${image.imageUrl.split('/').pop().split('.')[0]}`;
                const details = await getImageDetails(publicId);

                if (details && details.colors) {
                    // Start with non-color tags
                    const allColorNames = Object.keys(baseColors).map(c => c.toLowerCase());
                    let newTags = image.tags.filter(tag =>
                        !allColorNames.includes(tag.toLowerCase()) &&
                        !/^#[0-9a-f]{6}$/i.test(tag)
                    );

                    const thresholds = [15, 25, 30]; // Same strict thresholds
                    details.colors.slice(0, 3).forEach(([hex, freq], index) => {
                        const threshold = thresholds[index] || 30;
                        if (freq < threshold) return;

                        const colorName = getNearestColorName(hex).toLowerCase();
                        if (colorName !== 'other' && !newTags.includes(colorName)) {
                            newTags.push(colorName);
                        }
                        const normalizedHex = hex.toLowerCase();
                        if (!newTags.includes(normalizedHex)) {
                            newTags.push(normalizedHex);
                        }
                    });

                    image.tags = newTags;
                    await image.save();
                    updatedCount++;
                }
            } catch (err) {
                console.error(`Failed to re-index image ${image._id}:`, err.message);
                // Continue to next image
            }
        }

        res.json({ message: `Re-indexed ${updatedCount} images.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Re-index all image keywords (Migration)
// @route   POST /api/images/reindex-keywords
// @access  Private/Admin
export const reindexKeywords = async (req, res) => {
    try {
        const images = await Image.find({});
        let updatedCount = 0;

        for (const image of images) {
            try {
                const combinedKeywords = Array.from(new Set([
                    ...(image.title || '').toLowerCase().replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/),
                    ...(image.tags || []).map(t => t.toLowerCase())
                ]));

                // Contextual inference for junk titles - Aggressively check for objects
                const lowerTitle = (image.title || '').toLowerCase();
                const lowerTags = (image.tags || []).map(t => t.toLowerCase());

                if (lowerTitle.includes('pexels') || lowerTitle.includes('pixabay') || !isNaN(lowerTitle.split(' ')[0])) {
                    // Case 1: Garden/Park/Nature
                    if (lowerTags.some(t => ['nature', 'green', 'garden', 'forest', 'trees'].includes(t))) {
                        combinedKeywords.push('garden', 'trees', 'greenery', 'nature', 'outdoor', 'park', 'bench', 'chair', 'path', 'walkway', 'view', 'landscape');
                    }
                    // Case 2: City/Night
                    if (lowerTags.some(t => ['city', 'night', 'urban', 'buildings'].includes(t))) {
                        combinedKeywords.push('nightview', 'nightlife', 'nightcity', 'city', 'lights', 'architecture', 'metropolis', 'darkness');
                    }
                    // Case 3: Water/Beach
                    if (lowerTags.some(t => ['water', 'ocean', 'beach', 'sea', 'blue'].includes(t))) {
                        combinedKeywords.push('water', 'ocean', 'beach', 'waves', 'shore', 'coastal', 'summer', 'vacation', 'nature', 'scenic');
                    }
                } else {
                    // Small logic for non-junk but object-heavy titles
                    if (lowerTitle.includes('bench') || lowerTitle.includes('chair') || lowerTitle.includes('garden')) {
                        combinedKeywords.push('furniture', 'seating', 'park', 'outdoor', 'nature');
                    }
                }

                const finalKeywords = expandKeywords(combinedKeywords);
                image.keywords = finalKeywords;
                await image.save();
                updatedCount++;
            } catch (err) {
                console.error(`Failed to re-index keywords for ${image._id}:`, err.message);
            }
        }

        res.json({ message: `Bulk updated keywords for ${updatedCount} images.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};// @desc    Auto-tag single image
// @route   PUT /api/images/:id/auto-tag
// @access  Private/Admin
export const autoTagImage = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const combinedKeywords = Array.from(new Set([
            ...(image.title || '').toLowerCase().replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/),
            ...(image.tags || []).map(t => t.toLowerCase())
        ]));

        // Contextual inference for junk titles - Aggressively check for objects
        const lowerTitleStr = (image.title || '').toLowerCase();
        const lowerTagsArr = (image.tags || []).map(t => t.toLowerCase());

        if (lowerTitleStr.includes('pexels') || lowerTitleStr.includes('pixabay') || !isNaN(lowerTitleStr.split(' ')[0])) {
            // Case 1: Garden/Nature/Park
            if (lowerTagsArr.some(t => ['nature', 'green', 'garden', 'forest', 'trees'].includes(t))) {
                combinedKeywords.push('garden', 'trees', 'greenery', 'nature', 'outdoor', 'park', 'bench', 'chair', 'path', 'walkway', 'view', 'landscape');
            }
            // Case 2: City/Night
            if (lowerTagsArr.some(t => ['city', 'night', 'urban', 'buildings'].includes(t))) {
                combinedKeywords.push('nightview', 'nightlife', 'nightcity', 'city', 'lights', 'architecture', 'metropolis', 'darkness');
            }
            // Case 3: Water/Beach
            if (lowerTagsArr.some(t => ['water', 'ocean', 'beach', 'sea', 'blue'].includes(t))) {
                combinedKeywords.push('water', 'ocean', 'beach', 'waves', 'shore', 'coastal', 'summer', 'vacation', 'nature', 'scenic');
            }
        } else {
            // Non-junk object detection
            if (lowerTitleStr.includes('bench') || lowerTitleStr.includes('chair') || lowerTitleStr.includes('garden')) {
                combinedKeywords.push('furniture', 'seating', 'park', 'outdoor', 'nature');
            }
        }

        const finalKeywords = expandKeywords(combinedKeywords);
        image.keywords = finalKeywords;
        await image.save();
        res.status(200).json(image);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
