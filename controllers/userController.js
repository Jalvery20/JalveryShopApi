const User=require("../models/user")
var LocalStorage = require('node-localstorage').LocalStorage,
localStorage = new LocalStorage('./server/data');
const ErrorHandler=require("../utils/errorHandler")
const catchAsyncErrors=require("../middlewares/getAsyncError")
const sendToken=require("../utils/jwtToken")
const sendEmail=require("../utils/sendEmail")

const crypto= require("crypto")
const cloudinary = require("cloudinary")

//Register a user => /api/v1/register
exports.registerUser=catchAsyncErrors(async (req,res,next) =>{
    
   
    
    const {name,email,password}=req.body;

    const user=await User.create({
        name,
        email,
        password,
        /*avatar:{
            public_id:result.public_id,
            url:result.secure_url
        }*/
    })

    
    const token=user.getJwtToken()
    localStorage.setItem("token",JSON.stringify(token))
    res.status(201).json({
        success:true,
        token,
        user
    })
})

//Login User => /api/v1/login
exports.loginUser=catchAsyncErrors(async(req, res , next)=>{
    const {email,password}=req.body;

    //Checks if email and password is entered by user
    if(!email||!password){
        return next(new ErrorHandler("Please enter email and password",400))
    }

    //Finding user in database
    const user=await User.findOne({email}).select("+password")

    if(!user){
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    //Check if password is correct or not
    const isPasswordMatched=await user.comparePassword(password)

    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Email or Password", 401)); 
    }
    
    sendToken(user, 200, res)
})

//Forgot Password => /api/v1/password/forgot
exports.forgotPassword=catchAsyncErrors(async(req,res,next)=>{

    const user=await User.findOne({email:req.body.email});

    if(!user){
        return next(new ErrorHandler("User not found with this email",404))
    }

    //Get reset token
    const resetToken=user.getResetPasswordToken()

    await user.save({validateBeforeSave:false})

    //Create reset password url
    const resetUrl=`${process.env.FRONTEND_URL}/password/reset/${resetToken}`

    const message=`Your password reset token is as follow:\n\n${resetUrl}\n\n If you have not requested this email, then ignore this`

    try{
        await sendEmail({
            email:user.email,
            subject:"JalveryShop Password Recovery",
            message
        })

        res.status(200).json({
            success:true,
            message:`Email sent to:${user.email}`
        })
    }catch(error){
        user.resetPasswordExpire=undefined;
        user.resetPasswordToken=undefined;
    
        await user.save({validateBeforeSave:false})

        return next(new ErrorHandler(error.message,500))
    }
})

//Reset Password => /api/v1/password/reset/:token
exports.resetPassword=catchAsyncErrors(async(req,res,next)=>{

    //Hash URL token
    const resetPasswordToken=crypto.createHash("sha256").update(req.params.token).digest("hex")
    
    const user=await User.find({
        resetPasswordToken,
        resetPasswordExpire:{ $gt: Date.now() }
    })

    if(!user){
        return next(new ErrorHandler("Password reset token is invalid or has been expired",400))     
    }
    if(req.body.password!== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match",400))
    }

    //Setup new password
    user.password=req.body.password;
    
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;

    await user.save();

    sendToken(user,200,res)

})

//Get currently logged in user details => /api/v1/me
exports.getUserProfile=catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findById(req.user.id);
    res.status(200).json({
        success:true,
        user
    })
})

//Update/ Change passowrd=> /api/v1/password/update
exports.updatePassword=catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findById(req.user.id).select("+password");
    
    //Check previous user password
    const isMatched=await user.comparePassword(req.body.oldPassword);
    if(!isMatched){
        return next(new ErrorHandler("Old password is incorrect",400))
    }
    user.password=req.body.newPassword;

    await user.save()

    sendToken(user,200,res)

})

//Update user profile => /api/v1/update
exports.updateProfile=catchAsyncErrors(async(req,res,next)=>{
    
    const newUserData={
        name:req.body.name,
        email:req.body.email
    }
    //Update avatar
    
    
    if(req.body.avatar){


        const user=await User.findById(req.user.id)

        if(user.avatar.public_id){
            const image_id=user.avatar.public_id;
            const res=await cloudinary.v2.uploader.destroy(image_id)
        }
        let result;
        if(req.body.avatar.length>1_000_000){
             result=await cloudinary.v2.uploader.upload_large(req.body.avatar,{
                folder:"avatars",
                width:150,
                crop:"scale"
            })
        }else {
            result=await cloudinary.v2.uploader.upload(req.body.avatar,{
                folder:"avatars",
                width:150,
                crop:"scale",
                chunk_size:6000000
            })
        }

        newUserData.avatar={
            public_id:result.public_id,
            url:result.secure_url
        }
    }

    const user=await User.findByIdAndUpdate(req.user.id,newUserData,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })
    
    res.status(200).json({
        success:true,
    })

})
//Logout user => /api/v1/logout

exports.logout=catchAsyncErrors(async(req,res,next)=>{

    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true
    })
    localStorage.removeItem("token")

    res.status(200).json({
        success:true,
        message:"Logged out"
    })
})

//Admin Routes

//Get all users => /api/v1/admin/users
exports.allUsers=catchAsyncErrors(async(re,res,next)=>{
    const users=await User.find();

    res.status(200).json({
        success:true,
        users
    })
} )

//Get user details => /api/v1/admin/user/:id
exports.getUserDetails=catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success:true,
        user
    })
} )

//Update user profile => /api/v1/admin/user/:id
exports.updateUser=catchAsyncErrors(async(req,res,next)=>{
    
    const newUserData={
        name:req.body.name,
        email:req.body.email,
        role:req.body.role
    }

    const user=await User.findByIdAndUpdate(req.params.id,newUserData,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true,
    })

})

//Delete user => /api/v1/admin/user/:id
exports.deleteUser=catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    //Remove avatar from cloudinary 
    
    if(user.avatar.public_id){
        const image_id=user.avatar.public_id;
        await cloudinary.v2.uploader.destroy(image_id)
    }
    await user.remove()

    res.status(200).json({
        success:true
    })
} )