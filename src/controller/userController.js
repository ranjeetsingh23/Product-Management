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

        let { fname, lname, email, password, phone, address } = data;



        //validationg the request body
        if (validate.isValidBody(data)) return res.status(400).send({ status: false, message: "Enter details to create your account" });

        //validating firstname
        if (!fname) return res.status(400).send({ status: false, message: "First name is required" });

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
        if (!validate.isValidEmail(email.trim())) return res.status(400).send({ status: false, message: "Please Enter a valid Email-id" });


        //checking if email already exist or not
        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(400).send({ status: false, message: "Email already exist" })


        //checking for phone number
        if (!phone) return res.status(400).send({ status: false, message: "User Phone number is required" });

        //validating user phone
        if (!validate.isValidPhone(phone.trim())) return res.status(400).send({ status: false, message: "Please Enter a valid Phone number" });

        //checking if phone already exist or not
        let duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) return res.status(400).send({ status: false, message: "Phone already exist" })


        //checking for password
        if (!password) return res.status(400).send({ status: false, message: "Password is required" });

        //validating user password
        if (!validate.isValidPwd(password)) return res.status(400).send({ status: false, message: "Password should be between 8 and 15 character and it should be alpha numeric" });

        //checking for image link
        if (files.length === 0) return res.status(400).send({ status: false, message: "ProfileImage is required" });


        //checking for address
        if (!address || validate.isValid(data.address)) 
            return res.status(400).send({ status: false, message: "Address is required" });

        data.address = JSON.parse(data.address);
        

        let { shipping, billing } = data.address;
        //validating the address 
        if (data.address && typeof data.address != "object") {
            return res.status(400).send({ status: false, message: "Address is in wrong format" })
        };


        if (shipping) {
            //validation for shipping address
            if (typeof shipping != "object") {
                return res.status(400).send({ status: false, message: "Shipping Address is in wrong format" })
            };
            if (!shipping.street || validate.isValid(shipping.street)) {
                return res.status(400).send({ status: false, message: "Street is required" })
            }
            if (shipping.street && typeof shipping.street !== 'string') {
                return res.status(400).send({ status: false, message: "Street is in wrong format" })
            };
            if (!shipping.city || validate.isValid(shipping.city)) {
                return res.status(400).send({ status: false, message: "City is required" })
            }
            if (shipping.city && typeof shipping.city !== 'string') {
                return res.status(400).send({ status: false, message: "City is in wrong format" })
            };
            if (!validate.isvalidCity(shipping.city)) {
                return res.status(400).send({ status: false, message: "City name should only contain alphabets." });
            }
            if (!shipping.pincode) {
                return res.status(400).send({ status: false, message: "Pincode is required" })
            }
            if (validate.isValid(shipping.pincode)) {
                return res.status(400).send({ status: false, message: "Pincode is in wrong format" })
            };
            if (!validate.isValidPincode(shipping.pincode)) {
                return res.status(400).send({ status: false, message: "Please Provide valid Pincode " })
            };
        } else {
            return res.status(400).send({ status: false, message: "Shipping address is required" })
        }

        //validation for billing address
        if (billing) {

            //validation for billing address
            if (typeof billing !== "object") {
                return res.status(400).send({ status: false, message: "billing Address is in wrong format" })
            };
            if (!billing.street || validate.isValid(billing.street)) {
                return res.status(400).send({ status: false, message: "Street is required" })
            }
            if (billing.street && typeof billing.street != 'string') {
                return res.status(400).send({ status: false, message: "Street is in wrong format" })
            };
            if (!billing.city || validate.isValid(billing.city)) {
                return res.status(400).send({ status: false, message: "City is required" })
            }
            if (billing.city && typeof billing.city != 'string') {
                return res.status(400).send({ status: false, message: "City is in wrong format" })
            };
            if (!validate.isvalidCity(billing.city)) {
                return res.status(400).send({ status: false, message: "City name should only contain alphabets." });
            }
            if (!billing.pincode) {
                return res.status(400).send({ status: false, message: "Pincode is required" })
            }
            if (validate.isValid(billing.pincode)) {
                return res.status(400).send({ status: false, message: "Pincode is in wrong format" })
            };
            if (!validate.isValidPincode(billing.pincode)) {
                return res.status(400).send({ status: false, message: "Please Provide valid Pincode " })
            };
        } else {
            return res.status(400).send({ status: false, message: "billing address is required" })
        }

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

        if (validate.isValid(email)) return res.status(400).send({ status: false, message: "Email cannot be empty" });
        //email and password check from db
        let user = await userModel.findOne({ email: email });
        if (!user)
            return res.status(401).send({ status: false, message: "Invalid Email-Id" });
        //password is required
        if (!password)
            return res.status(400).send({ status: false, message: "user password is required" })

        if (validate.isValid(password)) return res.status(400).send({ status: false, message: "Password cannot be empty" })

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
        if (data.email && (!validate.isValidEmail(email))) return res.status(400).send({ status: false, message: "Please Enter a valid Email-id" });

        //checking if email already exist or not
        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(400).send({ status: false, message: "Email already exist" });

        //validating user phone number
        if (data.phone && (!validate.isValidPhone(phone))) return res.status(400).send({ status: false, message: "Please Enter a valid Phone number" });

        //checking if email already exist or not
        let duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) return res.status(400).send({ status: false, message: "Phone already exist" })

        if (data.password || typeof password == 'string') {
            //validating user password
            if (!validate.isValidPwd(password)) return res.status(400).send({ status: false, message: "Password should be between 8 and 15 character" });

            //hashing password with bcrypt
            data.password = await bcrypt.hash(password, 10);
        }

        if (data.address === "") {
            return res.status(400).send({ status: false, message: "Please enter a valid address" })
        } else if (data.address) {

            if (validate.isValid(data.address)) {
                return res.status(400).send({ status: false, message: "Please provide address field" });
            }
            data.address = JSON.parse(data.address);

            if (typeof data.address !== "object") {
                return res.status(400).send({ status: false, message: "address should be an object" });
            }
            let { shipping, billing } = data.address

            

            if (shipping) {
                if (typeof shipping != "object") {
                    return res.status(400).send({ status: false, message: "shipping should be an object" });
                }

                if (validate.isValid(shipping.street)) {
                    return res.status(400).send({ status: false, message: "shipping street is required" });
                }

                if (validate.isValid(shipping.city)) {
                    return res.status(400).send({ status: false, message: "shipping city is required" });
                }

                if (!validate.isvalidCity(shipping.city)) {
                    return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                }

                if (validate.isValid(shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "shipping pincode is required" });
                }

                if (!validate.isValidPincode(shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "please enter valid pincode" });
                }
            }else{
                return res.status(400).send({ status: false, message: "please enter shipping address" });
            }

            if (billing) {
                if (typeof billing != "object") {
                    return res.status(400).send({ status: false, message: "billing should be an object" });
                }

                if (validate.isValid(billing.street)) {
                    return res.status(400).send({ status: false, message: "billing street is required" });
                }

                if (validate.isValid(billing.city)) {
                    return res.status(400).send({ status: false, message: "billing city is required" });
                }
                if (!validate.isvalidCity(billing.city)) {
                    return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                }

                if (validate.isValid(billing.pincode)) {
                    return res.status(400).send({ status: false, message: "billing pincode is required" });
                }

                if (!validate.isValidPincode(billing.pincode)) {
                    return res.status(400).send({ status: false, message: "please enter valid billing pincode" });
                }
            }else{
                return res.status(400).send({ status: false, message: "please enter billing address" });
            }
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