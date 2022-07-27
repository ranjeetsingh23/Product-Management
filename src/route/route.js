const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");
const productController = require("../controller/productController");
const mid = require("../middleware/auth")

//User APIs
router.post("/register", userController.createUser)
router.post("/login", userController.userLogin)

router.get("/user/:userId/profile",mid.Authentication,mid.Authorization, userController.getUser)

router.put("/user/:userId/profile", mid.Authentication,mid.Authorization,userController.updateUser)


//Product APIs 

router.post('/products', productController.createProduct)

router.get('/products', productController.getProduct)

router.get('/products/:productId',productController.getProductById)
<<<<<<< HEAD
router.put( "/products/:productId",productController.deletebyId)
=======

router.put( "/products/:productId",productController.deletebyId)

>>>>>>> 586bad6e7d55418e7c5c5106447a7e09314ba5b9
module.exports = router