const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

async function auth(req,res,next){
    const token=req.cookies.token
    if(!token){
        return res.status(401).json({
        message: "Unauthorized"
        })
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
    const user=await userModel.findById(decoded.id)
    if(!user){
        return res.status(401).json({
            message:"Unauthorized User"
        })
    }
    req.user=user
    next();
    }
    catch(e){
        return res.status(401).json({
            message:"Unauthorized User"
        })
    }
}

module.exports={auth}