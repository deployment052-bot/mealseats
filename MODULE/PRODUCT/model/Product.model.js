const mongoose = require("mongoose");

const customizationOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  }
);



const customizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    required: {
      type: Boolean,
      default: false,
    },

    minSelection: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxSelection: {
      type: Number,
      default: 1,
      min: 1,
    },

    options: {
      type: [customizationOptionSchema],
      default: [],
    },
  },
  {
    _id: true,
  }
);



const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);


const productSchema = new mongoose.Schema(
  {
  

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

   

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },



    images: {
      type: [productImageSchema],
      default: [],
    },


    price: {
      type: Number,
      required: true,
      min: 1,
    },

    discountPrice: {
      type: Number,
      default: null,
      min: 0,

      validate: {
        validator: function (value) {
          if (value === null || value === undefined) {
            return true;
          }

          return value < this.price;
        },

        message:
          "Discount price must be less than original price",
      },
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

  

    foodType: {
      type: String,
      enum: ["VEG", "NON_VEG", "EGG"],
      required: true,
    },

    preparationTime: {
      type: Number,
      default: 15,
      min: 1,
    },

    servingSize: {
      type: String,
      trim: true,
      default: null,
    },

    calories: {
      type: Number,
      min: 0,
      default: null,
    },

    ingredients: {
      type: [String],
      default: [],
    },

    allergens: {
      type: [String],
      default: [],
    },

   

    customization: {
      type: [customizationSchema],
      default: [],
    },

   

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },

  

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },

  {
    timestamps: true,
  }
);



productSchema.index({
  name: "text",
  description: "text",
});


module.exports = mongoose.model(
  "Product",
  productSchema
);