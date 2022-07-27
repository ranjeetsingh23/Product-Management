const userModel = require("../model/userModel");
const validate = require("../validator/validator")
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const aws = require('../aws/aws-s3')

// --------------------------------------------- CREATE USER --------------------------------------------------------

exports.createUser = async (req, res) => {
    try {
        let data = req.body;
        let files = req.files;

        let { fname, lname, email, password, phone } = data;

        //validationg the request body
        if (validate.isValidBody(data)) return res.status(400).send({ status: false, message: "Enter details to create your account" });

        //validating firstname
        if (!fname) return res.status(400).send({ status: false, message: "First name is required" })

        //checking for firstname
        if (validate.isValid(fname)) return res.status(400).send({ status: false, message: "First name should not be an empty string" });

        //validating firstname
        if (validate.isValidString(fname)) return res.status(400).send({ status: false, message: "Enter a valid First name and should not contains numbers" });

        //validating lastname
        if (!lname) return res.status(400).send({ status: false, message: "Last name is required" })

        //checking for lastname
        if (validate.isValid(lname)) return res.status(400).send({ status: false, message: "Last name should not be an empty string" });

        //validating lastname
        if (validate.isValidString(lname)) return res.status(400).send({ status: false, message: "Enter a valid Last name and should not contains numbers" });


        //checking for email-id
        if (!email) return res.status(400).send({ status: false, message: "User Email-id is required" });

        //validating user email-id
        if (!validate.isValidEmail(email)) return res.status(400).send({ status: false, message: "Please Enter a valid Email-id" });


        //checking if email already exist or not
        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(400).send({ status: false, message: "Email already exist" })


        //checking for phone number
        if (!phone) return res.status(400).send({ status: false, message: "User Phone number is required" });

        //validating user phone
        if (!validate.isValidPhone(phone)) return res.status(400).send({ status: false, message: "Please Enter a valid Phone number" });

        //checking if phone already exist or not
        let duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) return res.status(400).send({ status: false, message: "Phone already exist" })


        //checking for password
        if (!password) return res.status(400).send({ status: false, message: "Password is required" });

        //validating user password
        if (!validate.isValidPwd(password)) return res.status(400).send({ status: false, message: "Password should be between 8 and 15 character" });

        //checking for image link
        if (files.length == 0) return res.status(400).send({ status: false, message: "ProfileImage is required" });


        //checking for address
        if (!data.address) return res.status(400).send({ status: false, message: "Address is required" });

        data.address = JSON.parse(data.address)
        let sAddress = data.address.shipping;
        let bAddress = data.address.billing;

        //validating the address 
        if (data.address && typeof data.address != "object") {
            console.log(typeof data.address)
            return res.status(400).send({ status: false, message: "Address is in wrong format" })
        };

        //validation for shipping address
        if (sAddress && typeof sAddress != "object") {
            return res.status(400).send({ status: false, message: "Shipping Address is in wrong format" })
        };
        if (data.address && sAddress && sAddress.street && validate.isValid(sAddress.street)) {
            return res.status(400).send({ status: false, message: "Street is in wrong format" })
        };
        if (data.address && sAddress && sAddress.city && validate.isValid(sAddress.city)) {
            return res.status(400).send({ status: false, message: "City is in wrong format" })
        };
        if (data.address && sAddress && sAddress.pincode && validate.isValid(sAddress.pincode)) {
            return res.status(400).send({ status: false, message: "Pincode is in wrong format" })
        };
        if (data.address && sAddress && sAddress.pincode && !validate.isValidPincode(sAddress.pincode)) {
            return res.status(400).send({ status: false, message: "Please Provide valid Pincode " })
        };

        //validation for billing address
        if (bAddress && typeof bAddress != "object") {
            return res.status(400).send({ status: false, message: "Billing Address is in wrong format" })
        };
        if (data.address && bAddress && bAddress.street && validate.isValid(bAddress.street)) {
            return res.status(400).send({ status: false, message: "Street is in wrong format" })
        };
        if (data.address && bAddress && bAddress.city && validate.isValid(bAddress.city)) {
            return res.status(400).send({ status: false, message: "City is in wrong format" })
        };
        if (data.address && bAddress && bAddress.pincode && validate.isValid(bAddress.pincode)) {
            return res.status(400).send({ status: false, message: "Pincode is in wrong format" })
        };
        if (data.address && bAddress && bAddress.pincode && !validate.isValidPincode(bAddress.pincode)) {
            return res.status(400).send({ status: false, message: "Please Provide valid Pincode " })
        };

        //hashing password with bcrypt
        data.password = await bcrypt.hash(password, 10);

        //getting the AWS-S3 link after uploading the user's profileImage
        let profileImgUrl = await aws.uploadFile(files[0]);
        data.profileImage = profileImgUrl;


        let responseData = await userModel.create(data);
        return res.status(201).send({ status: true, message: "User created successfully", data: responseData })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


// --------------------------------------------- USER LOGIN --------------------------------------------------------


exports.userLogin = async (req, res) => {

    try {
        let data = req.body;

        let { email, password } = data;

        //check data is exist | key exist in data
        if (validate.isValidBody(data)) {
            return res.status(400).send({ status: false, message: "Data is required to login" })
        }

        //email is required
        if (!email)
            return res.status(400).send({ status: false, message: "user Email is required" })


        //email and password check from db
        let user = await userModel.findOne({ email: email });
        if (!user)
            return res.status(401).send({ status: false, message: "Invalid Email-Id" });
        //password is required
        if (!password)
            return res.status(400).send({ status: false, message: "user password is required" })
        let actualPassword = await bcrypt.compare(password, user.password);
        if (!actualPassword) return res.status(401).send({ status: false, message: "Incorrect password" })


        let token = jwt.sign({
            "userId": user._id,
            "iat": new Date().getTime(),
            "exp": Math.floor(Date.now() / 1000) + 10 * 60 * 60
        }, "Secret")

        // res.setHeader("Authorization", token)
        return res.status(200).send({ status: true, message: "User login successfull", data: { userId: user._id, token: token } })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

// -------------------------------------------- GET /user/:userId/profile --------------------------------------------

exports.getUser = async (req, res) => {
    try {
        let userId = req.params.userId;

        //getting the user document
        const user = await userModel.findOne({ _id: userId })
        // if (!user) return res.status(404).send({ status: false, message: "User Not Found" })
        return res.status(200).send({ status: true, message: 'User Profile Details', data: user })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

// -------------------------------------------- PUT /user/:userId/profile --------------------------------------------

exports.updateUser = async (req, res) => {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let files = req.files;

        let { fname, lname, email, password, phone } = data;
       
         //getting user document
         let userProfile = await userModel.findById(userId);
         if (!userProfile) return res.status(404).send({ status: false, message: "User Not Found" });

        //getting the AWS-S3 link after uploading the user's profileImage
        if (files && files.length != 0) {
            let profileImgUrl = await aws.uploadFile(files[0]);
            data.profileImage = profileImgUrl;
        }

        //validationg the request body
        if (validate.isValidBody(data)) return res.status(400).send({ status: false, message: "Enter details to update your account data" });

        if (typeof fname == 'string') {
            //checking for firstname
            if (validate.isValid(fname)) return res.status(400).send({ status: false, message: "First name should not be an empty string" });

            //validating firstname
            if (validate.isValidString(fname)) return res.status(400).send({ status: false, message: "Enter a valid First name and should not contains numbers" });
        }
        
        if (typeof lname == 'string') {
            //checking for firstname
            if (validate.isValid(lname)) return res.status(400).send({ status: false, message: "Last name should not be an empty string" });

            //validating firstname
            if (validate.isValidString(lname)) return res.status(400).send({ status: false, message: "Enter a valid Last name and should not contains numbers" });
        }

        //validating user email-id
        if (data?.email && (!validate.isValidEmail(email))) return res.status(400).send({ status: false, message: "Please Enter a valid Email-id" });

        //checking if email already exist or not
        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(400).send({ status: false, message: "Email already exist" });

        //validating user phone number
        if (data?.phone && (!validate.isValidPhone(phone))) return res.status(400).send({ status: false, message: "Please Enter a valid Phone number" });

        //checking if email already exist or not
        let duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) return res.status(400).send({ status: false, message: "Phone already exist" })

        if (data?.password || typeof password == 'string') {
            //validating user password
            if (!validate.isValidPwd(password)) return res.status(400).send({ status: false, message: "Password should be between 8 and 15 character" });

            //hashing password with bcrypt
            data.password = await bcrypt.hash(password, 10);
        }

        if (data.address) {

            //converting string into object
            data.address = JSON.parse(data.address);

            //validating the address 
            if (typeof data.address != "object") {
                return res.status(400).send({ status: false, message: "Address is in wrong format" })
            }

            //tempAddress to store updated fields
            let tempAddress = JSON.parse(JSON.stringify(userProfile.address));
            if (data.address?.shipping) {
                //validation for shipping address
                if (typeof data.address?.shipping != "object") {
                    return res.status(400).send({ status: false, message: "Shipping Address is in wrong format" })
                };

                //checking for shipping street and storing it in temp address
                if (data.address.shipping?.street) {
                    if (validate.isValid(data.address.shipping.street)) {
                        return res.status(400).send({ status: false, message: "Street is in wrong format" })
                    };
                    tempAddress.shipping.street = data.address.shipping.street;
                }

                //checking for shipping city and storing it in temp address
                if (data.address.shipping?.city) {
                    if (validate.isValid(data.address.shipping.city)) {
                        return res.status(400).send({ status: false, message: "City is in wrong format" })
                    };
                    tempAddress.shipping.city = data.address.shipping.city;
                }

                if (data.address.shipping?.pincode) {
                    if (validate.isValid(data.address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: "Pincode is in wrong format" })
                    };
                    if (!validate.isValidPincode(data.address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: "Please Provide valid Pincode " })
                    };
                    tempAddress.shipping.pincode = data.address.shipping.pincode;
                }
            }
            //for billing
            if (data.address?.billing) {

                //validation for billing address
                if (typeof data.address?.billing != "object") {
                    return res.status(400).send({ status: false, message: "billing Address is in wrong format" })
                };

                //checking for billing street and storing it in temp address
                if (data.address.billing?.street) {
                    if (validate.isValid(data.address.billing.street)) {
                        return res.status(400).send({ status: false, message: "Street is in wrong format" })
                    };
                    tempAddress.billing.street = data.address.billing.street;
                }

                //checking for billing city and storing it in temp address
                if (data.address.billing?.city) {
                    if (validate.isValid(data.address.billing.city)) {
                        return res.status(400).send({ status: false, message: "City is in wrong format" })
                    };
                    tempAddress.billing.city = data.address.billing.city;
                }

                if (data.address.billing?.pincode) {
                    if (validate.isValid(data.address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "Pincode is in wrong format" })
                    };
                    if (!validate.isValidPincode(data.address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "Please Provide valid Pincode " })
                    };
                    tempAddress.billing.pincode = data.address.billing.pincode;
                }
            }
            
            data.address = tempAddress;   //storing updated adress in data
        }

        let updatedUser = await userModel.findOneAndUpdate(
            { _id: userId },
            data,
            { new: true }
        )
        return res.status(200).send({ status: true, message: "User profile updated", data: updatedUser })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}