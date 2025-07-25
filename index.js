import express from "express"
import bodyparser from "body-parser"
import mongoose from "mongoose"
import userRout from "./routs/userRout.js"
import productrouter from "./routs/productrouter.js";
import jwt, { decode } from "jsonwebtoken";
import dotenv from "dotenv"
import oderRouter from "./routs/oderrouter.js";
import taskrouter from "./routs/taskrouter.js";
import questionrouter from "./routs/questionrouter.js";
import cors from 'cors';
import giftcoderouter from "./routs/giftcoderouter.js";
import spinrouter from "./routs/spinrout.js";
import beetsrouter from "./routs/betitemrouter.js";
import betsrouter from "./routs/betsrouter.js";
import bet_item_srouter from "./routs/betitemrouter.js";
import adsrouter from "./routs/adsrout.js";
import walletrouter from "./routs/walletrouter.js";
dotenv.config()


  
const app = express();
const mongoURI = process.env.MONGO_DB_URL;

mongoose.connect(mongoURI, {});
const connection = mongoose.connection;
connection.once( 'open',()=>{
  console.log("Data Bace Is Connected") 
})
app.use(cors()); 
app.use(bodyparser.json());


app.use((req, res, next) => {
  const authHeader = req.header("Authorization");

  // If no auth header, skip token verification (optional: restrict to protected routes instead)
  if (!authHeader) {
    return next(); // OR: return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.replace("Bearer ", "");

  jwt.verify(token, process.env.JWT_KEY, (error, decoded) => {
    if (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = decoded;
    next();
  });
});


app.use('/api/user',userRout);
app.use('/api/product',productrouter);
app.use("/api/oder",oderRouter);
app.use('/api/task',taskrouter);
app.use('/api/question',questionrouter);
app.use('/api/redeem/gift',giftcoderouter);
app.use('/api/spin',spinrouter);
app.use('/api/bets-item',bet_item_srouter);
app.use('/api/bets',betsrouter);
app.use('/api/ads',adsrouter);
app.use('/api/wallet',walletrouter);

 
 

 
app.listen ( 
    5000, ()=> {
        console.log("app is running on port 5000")
    }
) 