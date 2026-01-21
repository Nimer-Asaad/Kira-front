import axios from "axios";

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    // You can upload to a service like Cloudinary or use local backend
    // For now, we'll return a local URL structure
    return {
      url: URL.createObjectURL(file),
      file: file,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
