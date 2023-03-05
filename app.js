const express=require("express");
const app=express();
const path=require("path")
const cookieParser=require("cookie-parser")
const bodyparser=require("body-parser")
const fileUpload=require("express-fileupload")


//Setting up config file
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
const products= require("./routes/product")
const auth= require("./routes/auth")
const order= require("./routes/order")
const payment= require("./routes/payment")




app.use("/api/v1",products)
app.use("/api/v1",auth)
app.use("/api/v1",order)
app.use("/api/v1",payment)

//Middleware to handle errors
app.use(errorMiddleware)


if(process.env.NODE_ENV==="PRODUCTION"){
  app.use(express.static("client/build"));
  app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  })
}

 module.exports=app;