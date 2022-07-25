const userModel = require("../model/userModel");
const validate = require("../validator/validator")
const jwt = require("jsonwebtoken");
const bcrypt =require('bcrypt');


exports.createUser = async (req,res) => {
    try{
        let data = req.body;

        const {fname,lname,email,password,phone,profileImage,address} = data;

        //validationg the request body
        if(validate.isValidBody(data)) return res.status(400).send({status: false, message: "Enter details to create your account"});

        //checking for firstname
        if(validate.isValid(fname)) return res.status(400).send({status: false, message: "First name is required and should not be an empty string"});

        //validating firstname
        if(validate.isValidString(fname)) return res.status(400).send({status: false, message: "Enter a valid First name and should not contains numbers"});

       

        //checking for lastname
        if(validate.isValid(lname)) return res.status(400).send({status: false, message: "Last name is required and should not be an empty string"});

         //validating lastname
         if(validate.isValidString(lname)) return res.status(400).send({status: false, message: "Enter a valid Last name and should not contains numbers"});

         
        //checking for email-id
        if(!email) return res.status(400).send({status: false, message: "User Email-id is required"});

        //validating user email-id
        if(!validate.isValidEmail(email)) return res.status(400).send({status: false, message: "Please Enter a valid Email-id"});


        //checking for phone number
        if(!phone) return res.status(400).send({status: false, message: "User Phone number is required"});
          
        //checking for password
        if(!password) return res.status(400).send({status: false, message: "Password is required"});

        //checking for address
        if(!address) return res.status(400).send({status: false, message: "Address is required"});

        //validating the address 
        if(validate.isValid(address)) return res.status(400).send({status: false, message: "Address should be in object and must contain shipping and billing addresses"});

         //validating the shipping address
    if (validate.isValid(address.shipping)) return res.status(400).send({ status: false, message: "Shipping address should be in object and must contain street, city and pincode" });

    //checking for street shipping address
    if (validate.isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Street is required of shipping address and should not be empty string" });

    //checking for city shipping address
    if (validate.isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "City is required of shipping address and should not be empty string" });

    //checking for pincode shipping address
    if (validate.isValid(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode is required of shipping address and should not be an empty string" });

    if (!validate.isValidString(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" });

    if (!validate.isValidPincode(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Enter a valid pincode" });

    //validating the billing address
    if (validate.isValid(address.billing)) return res.status(400).send({ status: false, message: "Billing address should be in object and must contain street, city and pincode" });

    //checking for street billing address
    if (validate.isValid(address.billing.street)) return res.status(400).send({ status: false, message: "Street is required of billing address and should not be empty string" });

    //checking for city billing address
    if (validate.isValid(address.billing.city)) return res.status(400).send({ status: false, message: "City is required of billing address and should not be empty string" });

    //checking for pincode billing address
    if (validate.isValid(address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode is required of billing address and should not be an empty string" });

    if (!validate.isValidString(address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" });

    if (!validate.isValidPincode(address.billing.pincode)) return res.status(400).send({ status: false, message: "Enter a valid pincode" });
    
    
    let responseData = await userModel.create(data);
    return res.status(201).send({status: true , message:"User created successfully" , data:responseData})

        

         
    }catch(error){
        return res.status(500).send({status: false , message:error.message})
    }
}

//validator functions 
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};


exports.userLogin = async function (req, res) {

    try {
    let data=req.body;
     let email= req.body.email;
     let password = req.body.password;
     
     //check data is exist | key exist in data
     if (Object.keys(data).length == 0) {
        return res.status(400).send({ status: false, message: "Data is required to login" })
    }

     //email is required
     if(!email) 
     return res.status(400).send({status:false,message:"user Email is required"})
     
     //password is required
     if(!password)
      return res.status(400).send({status:false,message:"user password is required"})
     
     //email and password check from db
     let user = await userModel.findOne({ email: email, password: password });
     if (!user)
         return res.status(401).send({ status: false, message: "credentials are not correct" });
       
       
         let token = jwt.sign({
            "userId": user._id,
            "iat": new Date().getTime(),
            "exp": Math.floor(Date.now() / 1000)+ 10*60*60
        }, "Secret")

        res.setHeader("Authorization", token)
        return res.status(200).send({ status: true, message: "User login successfull", data: {  userId : user._id,token :token } })

    } catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}