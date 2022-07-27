const productModel = require('../model/productModel');
const validate = require("../validator/validator")



//get product

exports.getProduct = async function (req, res) {
    try {
    
      let data = req.query
      let obj = {}
  
      if (data.name != undefined) {
        obj.title = data.name
      }
      if (data.size != undefined) {
        obj.availableSizes = data.size.toUpperCase()
      }
      if (data.priceGreaterThan != undefined) {
        obj.price = {$gt: data.priceGreaterThan};
      }
      if (data.priceLessThan != undefined) {
        obj.price = {$lt: data.priceLessThan}
      }
  
      obj.isDeleted = false;
  
      const productData = await productModel.find(obj).sort({price: 1}).select({deletedAt : 0})
  
      if (productData.length == 0) {
        return res.status(404).send({ status: false, message: "No product found" })
      }
  
      return res.status(200).send({ status: true, message: 'Success', data: productData })
    }
    catch (error) {
      res.status(500).send({ status: false, message: error.message });
    }
  }
  
  //getProductById
  
exports.getProductById= async function (req, res) {
  
    try {
        let id = req.params.productId
        if (!isValidObjectId(id)){
            return res.status(404).send({status:false, message:"Please enter valid product id"})
        }
        let isValidProductId = await productModel.findById({_id:id})
        if(!isValidProductId){
            return res.status(404).send({status:false, message:"Please enter valid product id"})
        }
        let isDeleted = await productModel.findOne({ _id:id , isDeleted: true });
  
       if(isDeleted){
      return res.status(404).send({status: true,message: "product is already deleted"});
  
    }
        let allProducts = await productModel.findOne({ _id: id, isDeleted: false }).select({deletedAt: 0})
        return res.status(200).send({status:true, message:"product found successfully" ,data:allProducts})
    } 
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
  }
  

  //delete
  exports. deletebyId=async function (req ,res){
    try {
        let ProductId=req.ProductId
        if(!validate.isValidObjectId(ProductId)){res.status(400).send({status:false,msg:"PLease rpovide valid Product Id"})}
        let getId=await productModel.findOne({_id:ProductId})
        if(!getId){
            {res.status(400).send({status:false,msg:"Product Not Found for the request id"})}
        }
        if(getId.isDeleted=="true"){
            {res.status(400).send({status:false,msg:"Product is already deleted "})}
        }
        await productModel.updateOne({_id:ProductId},{isDeleted:true,deletedAt:Date.now()})
        res.status(200).send({status:true,msg:"Product is deleted"})
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

};