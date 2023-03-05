const mongoose=require("mongoose");
const path = require("path");


//Setting up config file
require('dotenv').config({ path: path.resolve(__dirname, './config.env') });


const connectDatabase=()=>{
    console.log(process.env.DB_CLOUD_URL)
    mongoose.connect(process.env.DB_CLOUD_URL,{
        useNewUrlParser:true,
        useUnifiedTopology:true,
    }).then(con=> console.log(`MongoDb database connected with Host:${con.connection.host}`))
}

module.exports=connectDatabase