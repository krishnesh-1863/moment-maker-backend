const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const bcrypt=require("bcryptjs")


async function register(req,res){
    try{
        const {username,email,password}=req.body
    if (!username || !email || !password) {
    return res.status(400).json({
        message: "All fields are required"
    });
}
    const isUserAlreadyExist=await userModel.findOne({
        $or:[{username} , {email}]
    })
    if(isUserAlreadyExist){
        return res.status(409).json({
            message:"User already exist"
        })
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user=await userModel.create({
        username,email,password:hashedPassword

    })
     res.status(201).json({
            message:"User registered successfully",
            user:{
                id:user._id,
                username:user.username,
                email:user.email
            }
    })
    }
    catch(err){
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
    
}
async function login(req,res){
    try{
        const {email,password}=req.body
    if(!email || !password){
         return res.status(400).json({
        message: "Both email and password required"
    })
    }
    const user=await userModel.findOne({
        email
    })
    if(!user){
        return res.status(401).json({
        message: "Invalid email or password"
    })
    }
    const isMatch=await bcrypt.compare(password,user.password)
    if (!isMatch) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }  
    const token=jwt.sign({
        id:user._id
    },process.env.JWT_SECRET)

    res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
});
    return res.status(200).json({
    message: "Login successful",
    user: {
        id: user._id,
        username: user.username,
        email: user.email
    }
    });

}
    catch(e){
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}


    async function logout(req, res) {
    try {
        res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
});

        return res.status(200).json({
            message: "Logout successful"
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


module.exports={register,login,logout}