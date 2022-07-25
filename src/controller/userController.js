const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const validate = require('../utils/validation');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken')


//validator functions 
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};


const userLogin = async function (req, res) {

    try {

        let body = req.body
        let { email, password } = body

        if (!isValidRequestBody(body)) {
            return res.status(400).send({ status: false, message: "body must be present !!" })
        } else if (!email) {
            return res.status(400).send({ status: false, message: "email must be present" })

        } else if (!password) {
            return res.status(400).send({ status: false, message: "password must be present" })

        } else if (validate.isValidStringTrim(password)) {
            return res.status(400).send({ status: false, message: "password cannot be empty" })

        } else if (validate.isValidStringTrim(email)) {
            return res.status(400).send({ status: false, message: "email cannot be empty" })

        } else if (!validate.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "email must be valid formate" })

        }

        let checkEmail = await userModel.findOne({ email: email })
        if (!checkEmail) {
            return res.status(404).send({ status: false, message: "Please check email and try again" })
        }

        let checkPassword = await bcrypt.compare(password, checkEmail.password)

        if (!checkPassword) {
            return res.status(404).send({ status: false, message: "Please check password and try again" })
        }

        let token = jwt.sign({
            userLogin: checkEmail._id.toString(),
            Organizations: "group_53",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60)
        }, "secret")

        res.setHeader("group_53", token)
        return res.status(200).send({ status: true, message: "User login successfull", data: { userId: checkEmail._id, token } })

    } catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}


module.exports = { userLogin }