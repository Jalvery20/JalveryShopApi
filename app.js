const express=require("express");
const app=express();
const path=require("path")
const cookieParser=require("cookie-parser")
const bodyparser=require("body-parser")
const fileUpload=require("express-fileupload")

require('dotenv').config({ path: path.resolve(__dirname, './config.env') });

const errorMiddleware=require("./middlewares/errors")



app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin","*")
    res.setHeader("Access-Control-Allow-Methods","GET, POST, PUT, DELETE")
    res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept")
    next()
}
)
app.use(bodyparser.json())
app.use(cookieParser())
app.use(bodyparser.urlencoded({extended:true}))
app.use(fileUpload())


//Import routes
const admin= require("./routes/admin")
const catalog= require("./routes/catalog")



app.use("/api/v1",admin)
app.use("/api/v1",catalog)
//Middleware to handle errors
app.use(errorMiddleware)



 module.exports=app;