const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");
const productController = require("../controller/productController");
const mid = require("../middleware/auth")

// ---------------------------------------- USER API's -------------------------------------------
router.post("/register", userController.createUser)

router.post("/login", userController.userLogin)

router.get("/user/:userId/profile",mid.Authentication,mid.Authorization, userController.getUser)

router.put("/user/:userId/profile", mid.Authentication,mid.Authorization,userController.updateUser)



// ---------------------------------------- PRODUCT API's -------------------------------------------

router.post('/products', productController.createProduct)

router.get('/products', productController.getProduct)

router.get('/products/:productId',productController.getProductById)

router.put('/products/:productId',productController.updateProduct)

router.delete( "/products/:productId",productController.deletebyId)



// ---------------------------------------- CART API's -------------------------------------------




// ---------------------------------------- ORDER API's -------------------------------------------






module.exports = router;