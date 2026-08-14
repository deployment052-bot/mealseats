const express =require( "express");

const {
  createProduct,
} =require( "../controllers/product.controller.js");

const  { authMiddleware } =require("../middlewares/productUpload.js") ;
const { adminMiddleware }= require( "../../ADMIN(auth)/middleware/admin.middleware.js");
const { productUpload }= require ("../middlewares/productUpload.js");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
| POST /api/products
|
| Authenticated Admin only
| Supports multiple product images
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  productUpload,
  createProduct
);

export default router;