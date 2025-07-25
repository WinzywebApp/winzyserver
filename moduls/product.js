import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  coin_price: {
    type: Number, 
    default: 0,
  },
  main_price: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    required: true,
  },
  product_id: {
    type: String,
    required:true,
    unique:true
  },
 quantaty: {
    type: Number, 
    default: 0,
  },
   category: {
    type: String,
    enum: ["tech","beauty","perfume"],
    trim: true,
    required:true,
  },
  product_type:{
    type:String,
    enum:["a","b"],
    default:"a",
    required:true,
    trim:true
  }
});

const Product = mongoose.model("Product", productSchema);

export default Product;
