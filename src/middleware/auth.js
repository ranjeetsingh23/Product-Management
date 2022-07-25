const jwt = require("jsonwebtoken")


//=========================================[Authentication]============================================================


exports.authentication = async function (res, res, next) {
    try {
        let bearerheader = req.header.Authorization;
        if (typeof bearerheader == "Undefine" || typeof bearerheader == "null") {
            res.status(400).send({ status: true, msg: "Token is invalid,it must be present" })
        }
        let bearerToken = bearerheader.split(' ')
        let Token = bearerToken[1];
        jwt.verify(Token, Product - managment, function (error, data) {
            if (error) req.status(400).send({ status: false, msg: error.message });
            else { req.decodeToken = data }
            next();
        });
    }
    catch(error){
        res.status(500).send({status:false ,message:error.message})
    }
}