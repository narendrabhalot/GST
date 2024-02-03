const imageModel = require('../models/imageModel');

// Function to handle image upload and database storage
const uploadImage = async (req, res) => {
    let files= req.files
    try {
        if (!req.files) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log(req.files)
        for (const file of files) {
            const newImage = new imageModel({
                image: file.originalname,
                path: file.path,
            });

            await newImage.save();
        }
     
        // const savedImage = await newImage.save();
        return res.send({ message: 'File uploaded successfully',});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getImage=async (req,res)=>{

    const images= await imageModel.find()
    return res.status(200).send({status:true,data:images})

}
module.exports = { uploadImage ,getImage};
