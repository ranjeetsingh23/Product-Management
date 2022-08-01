const cartModel = require("../model/cartModel");
const validate = require("../validator/validator");


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