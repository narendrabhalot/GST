const imageModel = require('../models/imageModel');

// Function to handle image upload and database storage
const uploadImage = async (req, res) => {
    try {
        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const newImage = new imageModel({
            image: req.file.filename,
            path: req.file.path,
        });
        const savedImage = await newImage.save();
        return res.send({ message: 'File uploaded successfully', image: savedImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
module.exports = { uploadImage };
