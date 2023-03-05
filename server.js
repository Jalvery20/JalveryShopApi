const app=require("./app");
const connectDatabase=require("./config/database")

const cloudinary=require("cloudinary")
const path = require("path");


//Setting up config file
require('dotenv').config({ path: path.resolve(__dirname, './config.env') });

//Handle uncaught exceptions
process.on("uncaughtException",err=>{
  console.log(`ERROR:${err.stack}`);
  console.log(`Shutting down server due to uncaught exception`);
  process.exit(1)
})


//Connecting to MongoDB Database
connectDatabase()



// Setting up cloudinary config
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
})



const server=app.listen(process.env.PORT||4000,()=> console.log(`Server started at port:${process.env.PORT} in ${process.env.NODE_ENV} mode.`));

//Handle Unhandled Promise Rejection
process.on("unhandledRejection",err=>{
  console.log(`ERROR:${err.message}`);
  console.log("Shutting down the server due to Unhandled Promise rejection");
  server.close(()=>{
    process.exit(1)
  })
})