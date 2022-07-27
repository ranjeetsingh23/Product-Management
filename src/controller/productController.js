const productModel = require('../model/productModel');
//const mongoose = require('mongoose');
const validate = require("../validator/validator");
const aws = require('../aws/aws-s3');

exports.createProduct = async (req,res) =>{
    try{
           
        let data = req.body;
        let files = req.files;
          
        let {title, description,price,currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments,deletedAt} = data;

        //checking for the valid data
        if(validate.isValidBody(data)) return res.status(400).send({status: false, message:"Please provide data in body"});

        //validating the data
        if(!title) return res.status(400).send({status: false, message:"Title is Required"}); 

        if(validate.isValid(title)) return res.status(400).send({status: false, message:"Title is in wrong format"});

        if (validate.isValidString(title)) return res.status(400).send({ status: false, message: "Enter title and should not contains numbers" });

       //checking for duplicate title
       let duplicateTitle = await productModel.findOne({ title: title })
       if (duplicateTitle) return res.status(400).send({ status: false, message: "Title already exist" })


        if(!description) return res.status(400).send({status: false, message:"Description is Required"});

        if(validate.isValid(description)) return res.status(400).send({status: false, message:"description is in wrong format"});

        if (validate.isValidString(description)) return res.status(400).send({ status: false, message: "Enter description and should not contains numbers" });


        if(!price) return res.status(400).send({status: false, message:"price is Required"});

        if(!((validate.isValidString(price)) && validate.isValidPrice(price))) return res.status(400).send({status: false, message: "Price of product should be valid and in numbers"});

        if(!currencyId) return res.status(400).send({status: false, message:"currencyId is Required"});

        if(validate.isValid(currencyId)) return res.status(400).send({status: false, message:" currencyId should not be an empty string"});

        if(!(/INR/.test(currencyId))) return res.status(400).send({status: false, message:" currencyId should be in 'INR' Format"});

        if(!currencyFormat) return res.status(400).send({status: false, message:"currencyFormat is Required"});

        if(validate.isValid(currencyFormat)) return res.status(400).send({status: false, message:" currencyFormat should not be an empty string"});

        if(!(/₹/.test(currencyFormat))) return res.status(400).send({status: false, message:" currencyFormat should be in '₹' Format"});



        if(isFreeShipping || typeof isFreeShipping == 'string'){
            if(validate.isValid(isFreeShipping)) return res.status(400).send({status: false, message:" isFreeShipping should not be empty"});
         if(typeof data.isFreeShipping == 'string'){
            //converting it to lowercase and removing white spaces
            data.isFreeShipping = isFreeShipping.toLowerCase().trim();
            if(isFreeShipping == 'true' || isFreeShipping == 'false'){
            //converting from string to boolean
            data.isFreeShipping = JSON.parse(data.isFreeShipping);
            }else{
                return res.status(400).send({status: false, message: "Enter a boolean value for isFreeShipping"});
            }
         }
        // if(typeof data.isFreeShipping != 'boolean') return res.status(400).send({status:false , message: "Free shipping should be in boolean value"});

        }




       //checking for image link
       if (files.length == 0) return res.status(400).send({ status: false, message: "ProductImage is required" });

       //getting the AWS-S3 link after uploading the user's profileImage
       let profileImgUrl = await aws.uploadFile(files[0]);
       data.profileImage = profileImgUrl;

       if(!availableSizes) return res.status(400).send({status: false, message:"at least one availableSizes is Required"});
    }catch(error){
        return res.status(500).send({ status: false, message: error.message })
    }
}