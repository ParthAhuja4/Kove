import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (
  localFilePath: string,
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;
    const response: UploadApiResponse = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
        ],
      },
    );
    await fs.promises.unlink(localFilePath);
    return response;
  } catch (error) {
    await fs.promises.unlink(localFilePath);
    return null;
  }
};
export default uploadOnCloudinary;
