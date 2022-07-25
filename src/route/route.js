const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");
const mid = require("../middleware/auth")



module.exports = router