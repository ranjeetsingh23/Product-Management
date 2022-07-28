const productModel = require('../model/productModel');
//const mongoose = require('mongoose');
const validate = require("../validator/validator");
const aws = require('../aws/aws-s3');

exports.createProduct = async (req, res) => {
    try {

        let data = req.body;
        let files = req.files;

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data;

        //checking for the valid data
        if (validate.isValidBody(data)) return res.status(400).send({ status: false, message: "Please provide data in body" });

        //validating the data
        if (!title) return res.status(400).send({ status: false, message: "Title is Required" });

        if (validate.isValid(title)) return res.status(400).send({ status: false, message: "Title is in wrong format" });

        //checking for duplicate title
        let duplicateTitle = await productModel.findOne({ title: title })
        if (duplicateTitle) return res.status(400).send({ status: false, message: "Title already exist" })


        if (!description) return res.status(400).send({ status: false, message: "Description is Required" });

        if (validate.isValid(description)) return res.status(400).send({ status: false, message: "description is in wrong format" });


        if (!price) return res.status(400).send({ status: false, message: "price is Required" });

        if (!((validate.isValidString(price)) && validate.isValidPrice(price))) return res.status(400).send({ status: false, message: "Price of product should be valid and in numbers" });

        if (!currencyId) return res.status(400).send({ status: false, message: "currencyId is Required" });

        if (validate.isValid(currencyId)) return res.status(400).send({ status: false, message: " currencyId should not be an empty string" });

        if (!(/INR/.test(currencyId))) return res.status(400).send({ status: false, message: " currencyId should be in 'INR' Format" });

        if (!currencyFormat) return res.status(400).send({ status: false, message: "currencyFormat is Required" });

        if (validate.isValid(currencyFormat)) return res.status(400).send({ status: false, message: " currencyFormat should not be an empty string" });

        if (!(/₹/.test(currencyFormat))) return res.status(400).send({ status: false, message: " currencyFormat should be in '₹' Format" });



        if (isFreeShipping || typeof isFreeShipping == 'string') {
            if (validate.isValid(isFreeShipping)) return res.status(400).send({ status: false, message: " isFreeShipping should not be empty" });
            if (typeof data.isFreeShipping == 'string') {
                //converting it to lowercase and removing white spaces
                data.isFreeShipping = isFreeShipping.toLowerCase().trim();
                if (isFreeShipping == 'true' || isFreeShipping == 'false') {
                    //converting from string to boolean
                    data.isFreeShipping = JSON.parse(data.isFreeShipping);
                } else {
                    return res.status(400).send({ status: false, message: "Enter a boolean value for isFreeShipping" });
                }
            }
        }

        //checking for image link
        if (files.length == 0) return res.status(400).send({ status: false, message: "ProductImage is required" });

        //getting the AWS-S3 link after uploading the user's profileImage
        let profileImgUrl = await aws.uploadFile(files[0]);
        data.profileImage = profileImgUrl;

        //checking for style in data
        if (style) {
            if (validate.isValid(style) && validate.isValidString(style)) return res.status(400).send({ status: false, message: "Style should be valid an does not contain numbers" });
        }

        if (!availableSizes) return res.status(400).send({ status: false, message: " availableSizes is Required" });

        //checking for available Sizes of the products
        if (availableSizes) {
            let size = availableSizes.toUpperCase().split(",")  //creating an array
            data.availableSizes = size;
        }

        for (let i = 0; i < data.availableSizes.length; i++) {
            if (!validate.isValidSize(data.availableSizes[i])) {
                return res.status(400).send({ status: false, message: "Size should be one of these - 'S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'" })
            }
        }

        if (installments || typeof installments == 'string') {
            if (!validate.isValidString(installments)) return res.status(400).send({ status: false, message: "Installments should be in number" });
            if (!validate.isValidPrice(installments)) return res.status(400).send({ status: false, message: "Installments should be valid" });
        }

        let createProduct = await productModel.create(data);
        return res.status(201).send({ status: true, message: "Success", data: createProduct })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//Get Product
exports.getProduct = async function (req, res) {
    try {
        let userQuery = req.query
        let checkquery = validate.anyObjectKeysEmpty(userQuery)
        if (checkquery) return res.status(400).send({ status: false, message: `${checkquery} can't be empty` });
        let filter = { isDeleted: false }
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = userQuery


        if (Object.keys(userQuery).length > 0) {
            if (!validate.isValid(size)) {
                const sizeArray = size.trim().split(",").map((s) => s.trim());
                filter['availableSizes'] = { $in: sizeArray }
            }
            if (!validate.isValid(name)) {
                //const titleName = name.trim().split(",").map((s) => s.trim());
               const titleName = name.trim().split(" ").filter(word=>word).join(" ") //problem not solved here
                filter['title'] = { $regex: titleName, $options: 'i' }
            }
            if (priceGreaterThan) {
                if (validate.isValid(priceGreaterThan) || !validate.numCheck(priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "not valid price" })
                }
                filter['price'] = { $gt: priceGreaterThan }

            }
            if (priceLessThan) {
                if (validate.isValid(priceLessThan) || !validate.numCheck(priceLessThan)) {
                    return res.status(400).send({ status: false, message: "not valid price" })
                }
                filter['price'] = { $lt: priceLessThan }
            }

            if (priceGreaterThan && priceLessThan) {
                filter['price'] = { $gt: priceGreaterThan, $lt: priceLessThan }
            }

            if (priceSort) {
                if (!validate.isValid(priceSort)) {
                    if (!(priceSort == 1 || priceSort == -1))
                        return res.status(400).send({ status: false, message: "Price short value should be 1 or -1 only" })
                }
            }
        }

        let product = await productModel.find(filter).sort({ price: priceSort }).collation({ locale: "en", strength: 2 }); //to make case insensitive Indexes
        if (product.length === 0) return res.status(404).send({ status: false, message: "No products found" })
        return res.status(200).send({ status: true, message: 'Success', data: product })

    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ status: false, message: error.message });
    }
}



 //getProductById
 exports.getProductById= async function (req, res) {

    try {
        let id = req.params.productId
        if (!validate.isValidObjectId(id)) {
            return res.status(404).send({ status: false, message: "Please enter valid product id" })
        }
        let isValidProductId = await productModel.findById({_id:id})
        if(!isValidProductId){
            return res.status(404).send({status:false, message:"Plz enter valid product id"})
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

//Delete by Id
exports.deletebyId=async(req ,res) => {
    try {
        let product =req.params.productId
        if(!validate.isValidObjectId(product)){res.status(400).send({status:false,msg:"Please provide valid Product Id"})}
        let getId=await productModel.findOne({_id:product})
        if(!getId){
            {return res.status(404).send({status:false,msg:"Product Not Found for the request id"})}
        }
        if(getId.isDeleted=="true"){
            {return res.status(400).send({status:false,msg:"Product is already deleted "})}
        }
        await productModel.updateOne({_id:product},{isDeleted:true,deletedAt:Date.now()})
        return res.status(200).send({status:true,msg:"Product is deleted"})
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

};