import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  user_address: {
    phone_number: {
      type: String,
      required: true,
    },
    address_line: { 
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
  },
  product_details: {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    product_name: {
      type: String,
      required: true,
    },
    product_coin_balance: {
      type: Number,
      required: true, 
    },
    product_main_balance: {
      type: Number,
      required: true,
    },
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  order_created_date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  order_status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
