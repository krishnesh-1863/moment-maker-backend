const mongoose=require("mongoose")

const postSchema=new mongoose.Schema({
    image:String,
    imageFileId:String,
    caption:String,
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
})

const postModel=mongoose.model("post",postSchema)

module.exports=postModel