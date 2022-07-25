const jwt = require('jsonwebtoken')

exports.auth = (req, res, next)=>{
    try{
        let token = req.headers['']
        if(!token) token = req.headers['']
        if(!token){
            return res.status(401).send({status: false, message: "Token must be present"})
        }

        jwt.verify(token, "", (err, decodedToken) => {
            if(err){
                return res.status(401).send({status: false, message: "Incorrect Token"})
            }
            req.token = decodedToken_id
            next()
        })

    } catch (error){
        return res.status(500).send({status: false, message: error.message})
    }

}

