const productModel = require('../model/productModel');
const validate = require("../validator/validator");
const aws = require('../aws/aws-s3');

//---------------------------------------CREATE PRODUCTS-------------------------------------------

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


        if (currencyId || typeof currencyId == 'string') {
            //checking for currency Id
            if (validate.isValid(currencyId)) return res.status(400).send({ status: false, message: " currencyId should not be an empty string" });

            if (!(/INR/.test(currencyId))) return res.status(400).send({ status: false, message: " currencyId should be in 'INR' Format" });
        } else {
            data.currencyId = "INR"
        }

        if (currencyFormat || typeof currencyFormat == 'string') {
            //checking for currency format
            if (validate.isValid(currencyFormat)) return res.status(400).send({ status: false, message: "Currency format of product should not be empty" });

            if (!(/₹/.test(currencyFormat))) return res.status(400).send({ status: false, message: "Currency format of product should be in '₹' " });
        } else {
            data.currencyFormat = "₹"
        }


        if (isFreeShipping || typeof isFreeShipping == 'string') {
            if (validate.isValid(isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping should not contain white spaces" });
            if (typeof data.isFreeShipping == 'string') {
                //converting it to lowercase and removing white spaces
                data.isFreeShipping = isFreeShipping.toLowerCase().trim();
                if (isFreeShipping == 'true' || isFreeShipping == 'false') {
                    //converting from string to boolean
                    data.isFreeShipping = JSON.parse(data.isFreeShipping);
                } else {
                    return res.status(400).send({ status: false, message: "Please enter either 'true' or 'false'" })
                }
            }
        }

        //checking for image link
        if (files.length == 0) return res.status(400).send({ status: false, message: "ProductImage is required" });

        //getting the AWS-S3 link after uploading the user's profileImage
        let productImgUrl = await aws.uploadFile(files[0]);
        data.productImage = productImgUrl;

        //checking for style in data
        if (style) {
            if (validate.isValid(style) && validate.isValidString(style)) return res.status(400).send({ status: false, message: "Style should be valid an does not contain numbers" });
        }

        if (!availableSizes) return res.status(400).send({ status: false, message: " availableSizes is Required" });

        //checking for available Sizes of the products
        if (availableSizes) {
            let size = availableSizes.toUpperCase().split(",") //creating an array
            data.availableSizes = size;


            for (let i = 0; i < data.availableSizes.length; i++) {
                if (!validate.isValidSize(data.availableSizes[i])) {
                    return res.status(400).send({ status: false, message: "Size should be one of these - 'S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'" });
                }
            }
        }
        if (installments || typeof installments == 'string') {
            if (!validate.isValidString(installments)) return res.status(400).send({ status: false, message: "Installments should be in number" });
            if (!validate.isValidPrice(installments)) return res.status(400).send({ status: false, message: "Installments should be valid" });
        }

        let createProduct = await productModel.create(data);
        return res.status(201).send({ status: true, message: "Success", data: createProduct });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


// -------------------------------------------- GET PRODUCTS ---------------------------------------------

exports.getProduct = async (req, res) => {
    try {
        let userQuery = req.query
        let checkquery = validate.anyObjectKeysEmpty(userQuery)
        if (checkquery) return res.status(400).send({ status: false, message: `${checkquery} can't be empty` });

        let filter = { isDeleted: false }

        let { size, name, priceGreaterThan, priceLessThan, priceSort } = userQuery


        //if no filter is provided
        if (Object.keys(userQuery).length == 0) {

            //.collation is used to check substrings --- locale : en = english lang and will neglect pronunciation of words
            const product = await productModel.find({ isDeleted: false }).sort({ price: priceSort }).collation({ locale: "en", strength: 1 }); //to make case insensitive Indexes
            if (product.length == 0) return res.status(404).send({ status: false, msg: "No product found" });
            return res.status(200).send({ status: true, message: 'Success', data: product })
        }

        // If filter is provided
        let keys = "size, name, priceGreaterThan, priceLessThan, priceSort"

        if (userQuery.size || userQuery.priceSort || userQuery.priceLessThan || userQuery.priceGreaterThan || userQuery.name) {

            if (Object.keys(userQuery).length > 0) {

                if (!validate.isValid(size)) {
                    const sizeArray = size.trim().split(",").map((s) => s.trim());
                    filter['availableSizes'] = { $in: sizeArray }
                }


                if (name) {
                    if (validate.isValid(name)) {
                        return res.status(400).send({ status: false, message: "Not a valid Name" })
                    }
                    const titleName = name.replace(/\s{2,}/g, ' ').trim()
                    filter['title'] = { $regex: titleName, $options: 'i' }  //options: 'i' to make case insensitive

                }
                                                
                if (priceGreaterThan) {
                    if (validate.isValid(priceGreaterThan) || !validate.isValidPrice(priceGreaterThan)) {
                        return res.status(400).send({ status: false, message: "Not a valid priceGreaterThan" })
                    }
                    filter['price'] = { $gt: priceGreaterThan }

                }
                if (priceLessThan) {
                    if (validate.isValid(priceLessThan) || !validate.isValidPrice(priceLessThan)) {
                        return res.status(400).send({ status: false, message: "Not a valid priceLessThan" })
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

            //.collation is used to check substrings --- locale : en = english lang and will neglect pronunciation of words
            let product = await productModel.find(filter).sort({ price: priceSort }).collation({ locale: "en", strength: 1 }); //to make case insensitive Indexes
            if (product.length === 0) return res.status(404).send({ status: false, message: "No products found" })
            return res.status(200).send({ status: true, message: 'Success', data: product })

        } else {
            return res.status(400).send({ status: false, message: `Cannot provide keys other than ${keys}` })
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }


}



// ----------------------------------- GET product/:productId -------------------------------------------

exports.getProductById = async (req, res) => {

    try {
        let id = req.params.productId
        if (!validate.isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Please enter valid product id" })
        }
        let isValidProductId = await productModel.findById({ _id: id })
        if (!isValidProductId) {
            return res.status(404).send({ status: false, message: "Product id not found" })
        }
        if (isValidProductId.isDeleted == true) {
            return res.status(404).send({ status: true, message: "Product is already deleted" });
        }

        let allProducts = await productModel.findOne({ _id: id, isDeleted: false }).select({ deletedAt: 0 })
        return res.status(200).send({ status: true, message: "Success", data: allProducts })
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}


// ----------------------------------- PUT product/:productId --------------------------------------

exports.updateProduct = async (req, res) => {
    try {
        let productId = req.params.productId


        if (!validate.isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "Please provide valid Product Id" }) }
        let getId = await productModel.findOne({ _id: productId })
        if (!getId) {
            return res.status(404).send({ status: false, message: "Product Not Found for the request id" });
        }
        if (getId.isDeleted == true) {
            return res.status(404).send({ status: false, message: "Product is already deleted " });
        }
        let data = req.body;
        let files = req.files;
        // ===============================file validation=====================================

        if (validate.isValidBody(data)) return res.status(400).send({ status: false, message: "Body cannot be empty " })
        //checking for product image
        if (files && files.length > 0) {
            //uploading the product image
            let productImgUrl = await uploadFile(files[0]);
            data.productImage = productImgUrl;
        }

        // =================================================title validation=============================================================

        if (data.title || data.title == "string") {
            if (validate.isValid(data.title)) {
                return res.status(400).send({ status: false, message: "title should not be empty String" })
            }

            //Check the title for duplicate
            let duplicateTitle = await productModel.findOne({ title: data.title })
            if (duplicateTitle) {
                return res.status(400).send({ status: false, message: "title is already present in database" })
            }
        }
        // ==============================================Description validation============================

        if (data.description || data.description == "string") {
            if (validate.isValid(data.description)) {
                return res.status(400).send({ status: false, message: "Description should not be empty String" })
            }
            if (validate.isValidString(data.description)) {
                return res.status(400).send({ status: false, message: "Description should not contains numbers" })
            }
        }
        // ====================================price validation===============================================

        // value shouldnt be empty--- validation
        if (data.price || data.price == "string") {
            if (!(validate.isValidString(data.price) && validate.isValidPrice(data.price))) return res.status(400).send({ status: false, message: "Price of product should be valid and in numbers" });
        }
        // ==================================== currency validation=======================

        if (data.currencyId || typeof data.currencyId == 'string') {
            //checking for currencyId 
            if (validate.isValid(data.currencyId)) return res.status(400).send({ status: false, message: "Currency Id of product should not be empty" });

            if (!(/INR/.test(data.currencyId))) return res.status(400).send({ status: false, message: "Currency Id of product should be in uppercase 'INR' format" });
        }
        // ================================================= ========================================

        if (data.currencyFormat || typeof data.currencyFormat == 'string') {
            //checking for currency formate
            if (validate.isValid(data.currencyFormat)) return res.status(400).send({ status: false, message: "Currency format of product should not be empty" });

            if (!(/₹/.test(data.currencyFormat))) return res.status(400).send({ status: false, message: "Currency format of product should be in '₹' " });
        }
        // ==================================== free shipping validation========================
        if (data.isFreeShipping || typeof data.isFreeShipping == 'string') {
            if (validate.isValid(data.isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping should not contain white spaces" });
            //if the user given any whitespace
            data.isFreeShipping = data.isFreeShipping.toLowerCase().trim();//trim the whitespaces
            if (data.isFreeShipping == 'true' || data.isFreeShipping == 'false') {
                //convert from string to boolean
                data.isFreeShipping = JSON.parse(data.isFreeShipping);
            } else {
                return res.status(400).send({ status: false, message: "Please enter either 'true' or 'false'" })
            }
        }

        // =============================style validation===========================================
        if (data.style || typeof data.style == 'string') {
            if (validate.isValid(data.style)) return res.status(400).send({ status: false, message: "Style should be valid an does not contain numbers" });
            if (validate.isValidString(data.style)) return res.status(400).send({ status: false, message: "Style should be valid an does not contain numbers" });
        }
        // =============================availablesizes validation==========================================
        if (data.availableSizes || typeof data.availableSizes == 'string') {
            //checking for available Sizes of the products
            let size = data.availableSizes.toUpperCase().split(",") //creating an array
            data.availableSizes = size;

            for (let i = 0; i < data.availableSizes.length; i++) {
                if (!validate.isValidSize(data.availableSizes[i])) {
                    return res.status(400).send({ status: false, message: "Sizes should one of these - 'S', 'XS', 'M', 'X', 'L', 'XXL' and 'XL'" })
                }
            }
        }

        if (data.installments || typeof data.installments == 'string') {
            if (!validate.isValidString(data.installments)) return res.status(400).send({ status: false, message: "Installments should be in numbers and valid" });
        }

        let updatedProduct = await productModel.findByIdAndUpdate(
            { _id: productId },
            data,
            { new: true }
        )
        return res.status(200).send({ status: true, message: "Product updated successfully", data: updatedProduct })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


// ---------------------------------------- DELETE product/:productId --------------------------

exports.deletebyId = async (req, res) => {
    try {
        let product = req.params.productId
        if (!validate.isValidObjectId(product)) { res.status(400).send({ status: false, message: "Please provide valid Product Id" }) }
        let getId = await productModel.findOne({ _id: product });
        if (!getId) {
            { return res.status(404).send({ status: false, message: "Product Not Found for the request id" }) }
        }
        if (getId.isDeleted == true) {
            { return res.status(404).send({ status: false, message: "Product is already deleted not found" }) }
        }
        await productModel.updateOne({ _id: product }, { isDeleted: true, deletedAt: Date.now() })
        return res.status(200).send({ status: true, message: "Product is deleted" })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

};