const mongoose = require("mongoose");

const Product = require("../models/Product.model");
const Category = require("../models/Category.model");

const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");

const generateSlug = (text) => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const createProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    /*
    |--------------------------------------------------------------------------
    | 1. AUTH CHECK
    |--------------------------------------------------------------------------
    */

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 2. GET BODY
    |--------------------------------------------------------------------------
    */

    let {
      name,
      description,
      category,
      subCategory,
      price,
      discountPrice,
      tax,
      foodType,
      preparationTime,
      servingSize,
      calories,
      ingredients,
      allergens,
      customization,
      isAvailable,
      isFeatured,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | 3. BASIC VALIDATION
    |--------------------------------------------------------------------------
    */

    name = name?.trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Product name must be between 2 and 100 characters",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 4. PRICE VALIDATION
    |--------------------------------------------------------------------------
    */

    price = Number(price);

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    if (
      discountPrice !== undefined &&
      discountPrice !== null &&
      discountPrice !== ""
    ) {
      discountPrice = Number(discountPrice);

      if (discountPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Discount price cannot be negative",
        });
      }

      if (discountPrice >= price) {
        return res.status(400).json({
          success: false,
          message:
            "Discount price must be less than original price",
        });
      }
    } else {
      discountPrice = null;
    }

    /*
    |--------------------------------------------------------------------------
    | 5. TAX VALIDATION
    |--------------------------------------------------------------------------
    */

    tax = tax === undefined || tax === "" ? 0 : Number(tax);

    if (tax < 0) {
      return res.status(400).json({
        success: false,
        message: "Tax cannot be negative",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 6. FOOD TYPE VALIDATION
    |--------------------------------------------------------------------------
    */

    const allowedFoodTypes = [
      "VEG",
      "NON_VEG",
      "EGG",
    ];

    if (!allowedFoodTypes.includes(foodType)) {
      return res.status(400).json({
        success: false,
        message:
          "Food type must be VEG, NON_VEG or EGG",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 7. PREPARATION TIME
    |--------------------------------------------------------------------------
    */

    preparationTime =
      preparationTime === undefined ||
      preparationTime === ""
        ? 15
        : Number(preparationTime);

    if (preparationTime <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Preparation time must be greater than 0",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 8. CALORIES
    |--------------------------------------------------------------------------
    */

    if (
      calories !== undefined &&
      calories !== null &&
      calories !== ""
    ) {
      calories = Number(calories);

      if (calories < 0) {
        return res.status(400).json({
          success: false,
          message: "Calories cannot be negative",
        });
      }
    } else {
      calories = null;
    }

    /*
    |--------------------------------------------------------------------------
    | 9. CATEGORY CHECK
    |--------------------------------------------------------------------------
    */

    const categoryExists = await Category.findOne({
      _id: category,
      status: "ACTIVE",
    });

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 10. SUB CATEGORY CHECK
    |--------------------------------------------------------------------------
    */

    if (subCategory) {
      if (!mongoose.Types.ObjectId.isValid(subCategory)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sub-category ID",
        });
      }

      const subCategoryExists =
        await Category.findOne({
          _id: subCategory,
          status: "ACTIVE",
        });

      if (!subCategoryExists) {
        return res.status(404).json({
          success: false,
          message:
            "Sub-category not found or inactive",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 11. PARSE ARRAY FIELDS
    |--------------------------------------------------------------------------
    |
    | Form-data se arrays string ke form mein aa sakte hain.
    |
    */

    if (typeof ingredients === "string") {
      try {
        ingredients = JSON.parse(ingredients);
      } catch {
        ingredients = ingredients
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    if (!Array.isArray(ingredients)) {
      ingredients = [];
    }

    if (typeof allergens === "string") {
      try {
        allergens = JSON.parse(allergens);
      } catch {
        allergens = allergens
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    if (!Array.isArray(allergens)) {
      allergens = [];
    }

    if (typeof customization === "string") {
      try {
        customization = JSON.parse(customization);
      } catch {
        return res.status(400).json({
          success: false,
          message:
            "Customization must be valid JSON",
        });
      }
    }

    if (!Array.isArray(customization)) {
      customization = [];
    }

    /*
    |--------------------------------------------------------------------------
    | 12. CUSTOMIZATION VALIDATION
    |--------------------------------------------------------------------------
    */

    for (const item of customization) {
      if (!item.name?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Customization name is required",
        });
      }

      if (!Array.isArray(item.options)) {
        return res.status(400).json({
          success: false,
          message:
            "Customization options must be an array",
        });
      }

      if (
        item.minSelection !== undefined &&
        Number(item.minSelection) < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum selection cannot be negative",
        });
      }

      if (
        item.maxSelection !== undefined &&
        Number(item.maxSelection) < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum selection must be at least 1",
        });
      }

      for (const option of item.options) {
        if (!option.name?.trim()) {
          return res.status(400).json({
            success: false,
            message:
              "Customization option name is required",
          });
        }

        if (
          option.price === undefined ||
          Number(option.price) < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Customization option price cannot be negative",
          });
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 13. IMAGE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 14. GENERATE UNIQUE SLUG
    |--------------------------------------------------------------------------
    */

    const baseSlug = generateSlug(name);

    let slug = baseSlug;
    let counter = 1;

    while (await Product.exists({ slug })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    /*
    |--------------------------------------------------------------------------
    | 15. UPLOAD IMAGES TO CLOUDINARY
    |--------------------------------------------------------------------------
    */

    for (const file of req.files) {
      const uploaded =
        await uploadBufferToCloudinary(
          file.buffer,
          "mealeats/products"
        );

      uploadedImages.push({
        url: uploaded.url,
        publicId: uploaded.publicId,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 16. CREATE PRODUCT
    |--------------------------------------------------------------------------
    */

    const product = await Product.create({
      name,

      slug,

      description:
        description?.trim() || "",

      category,

      subCategory: subCategory || null,

      images: uploadedImages,

      price,

      discountPrice,

      tax,

      foodType,

      preparationTime,

      servingSize:
        servingSize?.trim() || null,

      calories,

      ingredients,

      allergens,

      customization,

      isAvailable:
        isAvailable === undefined
          ? true
          : isAvailable === true ||
            isAvailable === "true",

      isFeatured:
        isFeatured === true ||
        isFeatured === "true",

      status: "ACTIVE",

      createdBy: req.user._id,
    });

    /*
    |--------------------------------------------------------------------------
    | 17. POPULATE PRODUCT
    |--------------------------------------------------------------------------
    */

    const result = await Product.findById(
      product._id
    )
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .lean();

    /*
    |--------------------------------------------------------------------------
    | 18. RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: result,
    });
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | 19. CLOUDINARY CLEANUP
    |--------------------------------------------------------------------------
    |
    | Agar image upload ho gayi but DB create fail ho gaya,
    | toh uploaded images delete kar denge.
    |
    */

    if (uploadedImages.length > 0) {
      await Promise.all(
        uploadedImages.map((image) =>
          deleteFromCloudinary(image.publicId)
        )
      );
    }

    console.error(
      "Create Product Error:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE KEY
    |--------------------------------------------------------------------------
    */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Product with this information already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | MONGOOSE VALIDATION ERROR
    |--------------------------------------------------------------------------
    */

    if (error.name === "ValidationError") {
      const errors = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | DEFAULT SERVER ERROR
    |--------------------------------------------------------------------------
    */

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      ...(process.env.NODE_ENV === "development" && {
        error: error.message,
      }),
    });
  }
};