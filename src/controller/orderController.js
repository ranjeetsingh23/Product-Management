
const validate = require("../validator/validator");
const cartModel = require("../model/cartModel");
const orderModel = require("../model/orderModel");


// ---------------------------------- Create Order ------------------------------------------------------


exports.createOrder = async (req, res) => {
    try {
        let userId = req.params.userId;

        if (validate.isValid(userId)) {
            return res.status(400).send({ status: false, message: "User ID is missing" });
        }

        if (!validate.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid user Id" });
        }

        let data = req.body;


        if (validate.isValidBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

        let { cartId, status, cancellable } = data;

        if (!cartId)
            return res.status(400).send({ status: false, message: "Cart ID is required" });

        if (validate.isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Cart ID is missing" });
        }

        if (!validate.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Please provide valid cart Id" });
        }

        let findCart = await cartModel.findOne({ userId: userId });

        if (!findCart)
            return res.status(404).send({ status: false, message: `No such cart exist for ${userId}` });

        if (findCart.items.length === 0)
            return res.status(400).send({ status: false, message: "No Item in Cart" });

        let validStatus = ['pending', 'completed', 'cancelled']; //validating the status

        if (status) {
            //checking if the status is valid
            if (!validStatus.includes(status))
                return res.status(400).send({ status: false, message: "Status should be one of 'pending', 'completed', 'cancelled'" });
        }

        let validCancel = ['true', 'false'];
        if (cancellable) {
            if (!validCancel.includes(cancellable)) {
                return res.status(400).send({ status: false, message: "Please enter either 'true' or 'false'" })
            }
        }

        let totalQuantity = 0;
        for (let i = 0; i < findCart.items.length; i++)
            totalQuantity += findCart.items[i].quantity;


        data.userId = userId;
        data.items = findCart.items;
        data.totalPrice = findCart.totalPrice;
        data.totalItems = findCart.totalItems;
        data.totalQuantity = totalQuantity;

        let result = await orderModel.create(data);
        await cartModel.updateOne({ _id: findCart._id },
            { items: [], totalPrice: 0, totalItems: 0 });

        return res.status(201).send({ status: true, message: "Success", data: result })
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}


// ---------------------------------- Update Order ------------------------------------------------------

exports.updateOrder = async (req, res) => {
    try {
        let userId = req.params.userId;

        if (validate.isValid(userId)) {
            return res.status(400).send({ status: false, message: "User ID is missing" });
        }

        if (!validate.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid user Id" });
        }

        let data = req.body;


        if (validate.isValidBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

        let { orderId, status } = data;

        if (!orderId)
            return res.status(400).send({ status: false, message: "order ID is required" });

        if (validate.isValid(orderId)) {
            return res.status(400).send({ status: false, message: "order ID is missing" });
        }

        if (!validate.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "Please provide valid order Id" });
        }


        let validStatus = ['pending', 'completed', 'cancelled']; //validating the status

        if (status) {
            //checking if the status is valid
            if (!validStatus.includes(status))
                return res.status(400).send({ status: false, message: "Status should be one of 'pending', 'completed', 'cancelled'" });
        }

        let findOrder = await orderModel.findById({ _id: orderId })
        if (!findOrder)
            return res.status(404).send({ status: false, message: "No order found" })

        if (findOrder.isDeleted == true)
            return res.status(404).send({ status: false, message: "order is aready deleted" })

        if (findOrder.status == "completed") {
            return res.status(400).send({ status: false, message: "Cannot cancel completed order" })
        }
        if (findOrder.status === "cancelled") {
            return res.status(400).send({ status: false, message: "Order is already cancelled" })
        }

        let newStatus = {}
        if (status == "cancelled") {

            if (findOrder.cancellable == false) {
                return res.status(400).send({ status: false, message: "this order is not cancellable" })
            } else {
                newStatus.status = status
            }
        }


        let updateOrder = await orderModel.findByIdAndUpdate({ _id: findOrder._id }, newStatus, { new: true })

        return res.status(200).send({ status: true, message: "success", data: updateOrder })
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}