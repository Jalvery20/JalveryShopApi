const mongoose=require("mongoose");


const dotenv=require("dotenv")
//Setting up config file
dotenv.config({path:"server/config/config.env"})

const connectDatabase=()=>{
    mongoose.connect(process.env.MONGO_URI,{
        
        useNewUrlParser:true,
        useUnifiedTopology:true,
    }).then(con=> console.log(`MongoDb database connected with Host:${con.connection.host}`))
}

module.exports=connectDatabase