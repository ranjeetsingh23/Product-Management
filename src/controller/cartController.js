const cartModel = require("../model/cartModel");
const productModel = require('../model/productModel')
const validate = require("../validator/validator");


// ----------------------------- CREATE CART ------------
exports.createCart = async (req, res) => {
    try{
        let data = req.body
        let userId = req.params.userId

        let createCart = await cartModel.create(data)
        return res.status(201).send({status: true, message: "Cart Created Successfully" , data: createCart})


    }catch (error){
        return res.status(500).send({status: false, message: error.message})
    }
}



// ---------------------------- GET /users/:userId/cart -------------------------------------------

exports.getCart = async (req,res) =>{
    try{
         let userId = req.params.userId;
      
         //checking if the cart is present with this userId or not
         let findCart = await cartModel.findOne({userId : userId}).populate('items.productId');
         if(!findCart) return res.status(404).send({ status: false , message: `No cart found with this ${userId} userId`});

         return res.status(200).send({status: true , message: "Success" ,data:findCart});

    }catch(error){
        return res.status(500).send({ status: false, message:error.message});
    }
}


// ---------------------------- PUT /users/:userId/cart -------------------------------------------

exports.updateCart = async(req, res) => {
    try{

        let userId = req.params.userId;
        let data = req.body
        
        // checking if cart is present or not
        let cart = await cartModel.findOne({userId :userId, _id: data.cartId});
        if(!cart){
            return res.status(400).send({ status: false , message: `No cart found with this ${userId} userId`});
        }

        //checking if cart is emoty or not
        if(cart.items.length == 0){
            return res.status(400).send({ status: false , message: "Cart is empty"});
        }

        
        //
        if(validate.isValid(data)){
            return res.status(400).send({ status: false , message: "Please provide details to remove product from cart "});
        }
        if(data.totalPrice || data.totalItems || typeof data.totalPrice == "string" || typeof data.totalItems == "string"){
            return res.status(400).send({status: false, message: "Cannot change or update total price or total Items"})
        }
        if(data.cartId || typeof data.cartId == "string"){
            if(validate.isValid(data.cartId)){
                return res.status(400).send({ status: false , message: "Please provide valid cart Id"});
            }
            if(!validate.isValidObjectId(data.cartId)){
                return res.status(400).send({ status: false , message: "Provide Valid Cart Id"});
            }
            if(cart._id.toString() !== data.cartId){
                return res.status(400).send({status: false, message: "cart Id is invalid. Please provide correct cart Id"})
            }
        }
        if(validate.isValid(data.productId)){
            return res.status(400).send({ status: false , message: "Please provide product Id "});
        }
        if(!validate.isValidObjectId(data.productId)){
            return res.status(400).send({status: false, message: "Please provide valid product Id"})
        }
        let findProduct = await productModel.findById({_id : data.productId})
        if(!findProduct){
            return res.status(404).send({status: false, message: "No product found with this product Id"})
        }
        if(data.removeProduct == "undefined"){
            return res.status(400).send({status: false, message: "removeProduct is required"})
        }
        if(!(/0|1/.test(data.removeProduct))){
            return res.status(400).send({status: false, message: "removeProduct should be either 0 or 1"})
        }

        let productArr = cart.items.filter(x => {
            x.productId.toString() == data.productId
            console.log(productArr)
        })
        if(productArr.length == 0){
            return res.status(400).send({status: false, message: "Product is not present in cart"})
        }

        let index = cart.items.indexOf(productArr[0])
        if(data.removeProduct == 0){

            cart.totalPrice = cart.totalPrice - findProduct.price * cart.items[index].quantity.toFixed(2)
            cart.items.splice(index, 1)
            cart.totalItems = cart.items.length
            cart.save()
        }
        return res.status(200).send({status: true, message: "Data updated successfuly", data: cart})       

    } catch(error){
        return res.status(500).send({status: false, message: error.message})
    }

}