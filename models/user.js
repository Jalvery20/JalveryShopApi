const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const mongoose=require("mongoose")
const validator=require("validator")
const crypto=require("crypto")

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter your name"],
        maxLength:[30,"Your name cannot exceed 30 characters"]
    },
    email:{
        type:String,
        required:[true,"Please enter your email"],
        unique:[true,"This email address is already taken"],
        validate:[validator.isEmail, "Please enter a valid email address"]
    },
    password:{
        type:String,
        required:[true,"Please enter your password"],
        minlength:[6,"Your password must be longer thn 6 characters"],
        select:false
    },
    avatar:{
        public_id:{
            type:String,
        },
        url:{
            type:String
        }
    },
    role:{
        type:String,
        default:"user"
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date
})

// Encrypting password before saving
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        next()
    }
    this.password=await bcrypt.hash(this.password,10)
})
//Compare user password
userSchema.methods.comparePassword=async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password)
}

//Return JWT token 
userSchema.methods.getJwtToken=function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_TIME
    })
}

//Generate password reset token
userSchema.methods.getResetPasswordToken=function(){
    //Generate token
    const resetToken= crypto.randomBytes(20).toString("hex");

    //Hash and set to resetPasswordToken
    this.resetPasswordToken=crypto.createHash("sha256").update(resetToken).digest("hex");

    //Set token expire time
    this.resetPasswordExpire=Date.now() + 30 *60 *1000

    return resetToken
}
module.exports=mongoose.model("User",userSchema)