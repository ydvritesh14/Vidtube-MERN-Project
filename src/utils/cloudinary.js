import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
//To design a method & in argument we provide URL & file path & that goes to cloudnary

dotenv.config();
// Configure the cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded on Cloudinary. Filesrc:" + response.url);
    //Once it is uploaded ,we would like to delete it from server
    if(fs.existsSync(localFilePath)){
        fs.unlinkSync(localFilePath);
    }
    // fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.log(error);
    // fs.unlinkSync(localFilePath);
    return null;
  }

};

//To delete from cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log("Deletd from cloudinary.Public is", publicId);
    } catch (error) {
      console.log("Error deleting from cloudinary", error);
      return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
