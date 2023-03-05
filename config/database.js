const mongoose=require("mongoose");
const path = require("path");


//Setting up config file
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const connectDatabase=()=>{
    mongoose.connect(process.env.MONGO_URI,{
        
        useNewUrlParser:true,
        useUnifiedTopology:true,
    }).then(con=> console.log(`MongoDb database connected with Host:${con.connection.host}`))
}

module.exports=connectDatabase