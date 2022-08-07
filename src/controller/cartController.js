const validate = require("../validator/validator");
const productModel = require('../model/productModel');
const userModel = require('../model/userModel');
const cartModel = require('../model/cartModel');




// ---------------------------------- Create Cart ------------------------------------------------------

exports.createCart = async (req, res) => {
    try {

        let data = req.body;

        if (validate.isValidBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

        let userId = req.params.userId;

        if (!validate.isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })


        let { productId, cartId, quantity } = data
        if (validate.isValid(productId))
            return res.status(400).send({ status: false, message: "Product Id is required" })


          // Validation in case user sending data in JSON Body
        if(quantity < 1 && typeof quantity == "number"){
            return res.status(400).send({status: false, message: "Value should not be less than 1"})
        }

        if (!quantity) {
            quantity = 1
        }
        quantity = Number(quantity) //In case of form data we are type casting to Number(quantity)
        if (quantity && typeof quantity != "number" || isNaN(quantity))
            return res.status(400).send({ status: false, message: "Quantity should be number" })

        if (quantity < 1){
            return res.status(400).send({ status: false, message: "Quantity cannot be less than 1" })
        }
        if (!validate.isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid product ID" })

        if (cartId) {
            if (!validate.isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: "Invalid cart ID" })
        }

        //checking for valid user
        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

        if (cartId) {
            var findCart = await cartModel.findOne({ _id: cartId })
            if (!findCart)
                return res.status(404).send({ status: false, message: "Cart does not exists" })
        }

        //searching for product    
        let validProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!validProduct) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })

        let validCart = await cartModel.findOne({ userId: userId })
        if (!validCart && findCart) {
            return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
        }
        if (validCart) {
            if (cartId) {
                if (validCart._id.toString() != cartId)
                    return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
            }
            let productidincart = validCart.items
            let uptotal = (validCart.totalPrice + (validProduct.price * Number(quantity))).toFixed(2)
            let proId = validProduct._id.toString()
            for (let i = 0; i < productidincart.length; i++) {
                let productfromitem = productidincart[i].productId.toString()


                //updates old product i.e QUANTITY
                if (proId == productfromitem) {
                    let oldQuant = productidincart[i].quantity
                    let newquant = oldQuant + quantity
                    productidincart[i].quantity = newquant
                    validCart.totalPrice = uptotal
                    await validCart.save();
                    return res.status(201).send({ status: true, message: 'Success', data: validCart })
                }
            }
            //adds new product
            validCart.items.push({ productId: productId, quantity: Number(quantity) })
            let total = (validCart.totalPrice + (validProduct.price * Number(quantity))).toFixed(2)
            validCart.totalPrice = total
            let count = validCart.totalItems
            validCart.totalItems = count + 1
            await validCart.save()
            return res.status(201).send({ status: true, message: 'Success', data: validCart })
        }

        // 1st time cart
        let calprice = (validProduct.price * Number(quantity)).toFixed(2)
        let obj = {
            userId: userId,
            items: [{
                productId: productId,
                quantity: quantity
            }],
            totalPrice: calprice,
        }
        obj['totalItems'] = obj.items.length
        let result = await cartModel.create(obj)

        return res.status(201).send({ status: true, message: 'Success', data: result })
    }
    catch (error) {
        return res.status(500).send({ status: false, error: error.message });
    }
}

// ---------------------------------- GET cart ---------------------------------------------------------
exports.getCart = async (req, res) => {
    try {
        let userId = req.params.userId;

        //checking if the cart is present with this userId or not
        let findCart = await cartModel.findOne({ userId: userId }).populate('items.productId');
        if (!findCart) return res.status(404).send({ status: false, message: `No cart found with this ${userId} userId` });

        return res.status(200).send({ status: true, message: "Success", data: findCart });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

// ---------------------------------- PUT /users/:userId/cart ------------------------------------------

exports.updateCart = async (req, res) => {
    try {

        let userId = req.params.userId;
        let data = req.body

        if (validate.isValid(data)) {
            return res.status(400).send({ status: false, message: "Please provide details to remove product from cart " });
        }

        // checking if cart is present or not
        let cart = await cartModel.findOne({ userId: userId });
        if (!cart) {
            return res.status(400).send({ status: false, message: `No cart found with this ${userId} userId` });
        }

        if (data.totalPrice || data.totalItems || typeof data.totalPrice == "string" || typeof data.totalItems == "string") {
            return res.status(400).send({ status: false, message: "Cannot change or update total price or total Items" })
        }
        if (data.cartId || typeof data.cartId == "string") {
            if (validate.isValid(data.cartId)) {
                return res.status(400).send({ status: false, message: "Please provide valid cart Id" });
            }
            if (!validate.isValidObjectId(data.cartId)) {
                return res.status(400).send({ status: false, message: "Provide Valid Cart Id" });
            }
            if (cart._id.toString() !== data.cartId) {
                return res.status(400).send({ status: false, message: `cart Id does not match with provided User ID ${userId}` })
            }
        }
        if (validate.isValid(data.productId)) {
            return res.status(400).send({ status: false, message: "Please provide product Id " });
        }
        if (!validate.isValidObjectId(data.productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid product Id" })
        }
        let findProduct = await productModel.findById({ _id: data.productId })
        if (!findProduct) {
            return res.status(404).send({ status: false, message: "No product found with this product Id" })
        }
        if (validate.isValid(data.removeProduct)) {
            return res.status(400).send({ status: false, message: "removeProduct is required" })
        }
        if (!(/0|1/.test(data.removeProduct))) {
            return res.status(400).send({ status: false, message: "removeProduct should be either 0 or 1" })
        }

        let productArr = cart.items.filter(x =>
            x.productId.toString() == data.productId)

        if (productArr.length == 0) {
            return res.status(400).send({ status: false, message: "Product is not present in cart" })
        }

        let index = cart.items.indexOf(productArr[0])

        if (data.removeProduct == 0) {

            cart.totalPrice = (cart.totalPrice - (findProduct.price * cart.items[index].quantity)).toFixed(2)
            cart.items.splice(index, 1)
            cart.totalItems = cart.items.length
            cart.save()
        }

        if (data.removeProduct == 1) {

            cart.items[index].quantity -= 1;
            cart.totalPrice = (cart.totalPrice - findProduct.price).toFixed(2)
            if (cart.items[index].quantity == 0) {

                cart.items.splice(index, 1)
            }
            cart.totalItems = cart.items.length
            cart.save()
        }
        return res.status(200).send({ status: true, message: "Success", data: cart })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}


// ---------------------------------- DELETE /users/:userId/cart ---------------------------------------

exports.deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId;

        //checking if the cart is present with this userId or not
        let findCart = await cartModel.findOne({ userId: userId });

        if (findCart.items.length == 0) {
            return res.status(400).send({ status: false, message: "Cart is already empty" });
        }

        await cartModel.updateOne({ _id: findCart._id },
            { items: [], totalPrice: 0, totalItems: 0 });

        return res.status(204).send({ status: false, message: "Deleted Sucessfully" });


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}
