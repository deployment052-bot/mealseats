const  cloudinary =require ("cloudinary");

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBufferToCloudinary = (
  buffer,
  folder = "mealeats/products"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.v2.uploader.destroy(publicId);
  } catch (error) {
    console.error(
      "Cloudinary delete error:",
      error.message
    );
  }
};