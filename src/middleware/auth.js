const jwt = require("jsonwebtoken")
const userModel = require('../model/userModel')
const validate = require("../validator/validator")

//=========================================[Authentication]============================================================


exports.Authentication = async (req, res, next) => {
    try {
        let bearerHeader = req.headers.authorization;
        if(typeof bearerHeader == "undefined") return res.status(400).send({ status: false, message: "Token is missing" });
        
        let bearerToken = bearerHeader.split(' ');
        let token = bearerToken[1];
        jwt.verify(token, "Secret", function (error,data) {
          if(error) {

            return res.status(401).send({ status: false, message: error.message });
          }else {
            req.decodedToken = data
            next()
          }
        });
      } catch (error) {
       return res.status(500).send({ status: false, error: error.message });
      }
    }


//=========================================[Authorisation]============================================================

exports.Authorization = async (req, res, next) => {
    try {
        let loggedInUser = req.decodedToken.userId;
        let loginUser;
        
        if(req.params.userId){
          if(!validate.isValidObjectId(req.params.userId)) return res.status(400).send({ status: false, message: "Enter a valid user Id" });
          let checkUserId = await userModel.findById(req.params.userId);
          if(!checkUserId) return res.status(404).send({ status: false, message: "User not found" });
          loginUser = checkUserId._id.toString();
        }
    
        if(!loginUser) return res.status(400).send({ status: false, message: "User-id is required" });
    
        if(loggedInUser !== loginUser) return res.status(403).send({ status: false, message: "Error!! authorization failed" });
        next();
      } catch (error) {
        return res.status(500).send({ status: false, error: error.message });
      }
    }