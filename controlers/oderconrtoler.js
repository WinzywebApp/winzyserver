import Order from '../moduls/oder.js';
import Product from '../moduls/product.js';
import User from '../moduls/user.js'
import { sendOrderPlaced , sendOrderStatusUpdate  } from "../bot/bot.js";


 



export async function orderCreate(req, res) {
  try {
    const user = req.user;
    // ✅ Authentication Check
    if (!user) {
      return res.status(401).json({ message: "Please login first" });
    }

    // ✅ Authorization Check
    if (user.type !== "customer") {
      return res.status(403).json({ message: "Only customers can place orders" });
    } 

    const { product_id, quantity, user_address } = req.body;

    // ✅ Phone Number Validation
    if (!/^\d{10}$/.test(user_address.phone_number)) {
      return res.status(400).json({ message: "Phone number must be 10 digits" });
    }

    // ✅ Find Product by product_id (your custom field)
    const product = await Product.findOne({ product_id: product_id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Check Product Quantity
    if (product.quantaty < quantity) {
      return res.status(400).json({ message: "Not enough product stock available" });
    }

    const total_coin_balance = product.coin_price * quantity;
    const total_main_balance = product.main_price * quantity;

    // ✅ Find User in DB
    const dbUser = await User.findOne({ email: user.email });
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check User Balances
    if (
      dbUser.coin_balance < total_coin_balance ||
      dbUser.main_balance < total_main_balance
    ) {
      return res.status(400).json({ message: "Insufficient balance to place the order" });
    }

    // ✅ Generate Order ID
    const last = await Order.find({})
      .sort({ order_created_date: -1 })
      .limit(1)
      .exec();

    let newOrderId;
    if (last.length > 0 && last[0].order_id) {
      const lastNumber = parseInt(last[0].order_id.slice(10), 10);
      const next = lastNumber + 1;
      newOrderId = `winzy_od_${next.toString().padStart(4, '0')}`;
    } else {
      newOrderId = "winzy_od_0001";
    }

    // ✅ Build Order Product Details — FIXED FIELD NAMES AND TYPES
    const product_details = {
      product_id: product._id,
      product_name: product.name,
      product_coin_balance: product.coin_price,
      product_main_balance: product.main_price
    };

    // ✅ Create New Order
    const newOrder = new Order({
      order_id: newOrderId,
      user_email: user.email,
      user_address,
      product_details,
      quantity,
      order_created_date: new Date()
    });

    await newOrder.save();

    // ✅ Update Product Stock
    product.quantaty -= quantity;
    await product.save();

    // ✅ Update User Balances
    dbUser.coin_balance -= total_coin_balance;
    dbUser.main_balance -= total_main_balance;
    await dbUser.save();

    // ✅ Send Telegram notification if chat id available
   try {
  const telegramChatId = user.telegram_chat_id || dbUser.telegram_chat_id;
  if (telegramChatId) {
    // Prepare order summary for bot, including status
    const orderForBot = {
      order_id: newOrderId,
      product_name: product.name,
      price: total_main_balance, // or include both coin & main if needed
      currency: "LKR",
      status: newOrder.status || "pending", // එක schema එකේ තියෙන status එක හෝ default එකක්
      date: newOrder.order_created_date || new Date()
    };
    await sendOrderPlaced(telegramChatId.toString(), orderForBot);
  }
}
  catch (botErr) {
      console.warn("Failed to send Telegram order notification:", botErr?.message || botErr);
      // not blocking the main response
    }

    // ✅ Success Response
    return res.status(201).json({
      message: "Order placed successfully",
      order_id: newOrderId,
      order: newOrder
    });

  } catch (err) {
    console.error("Error saving order:", err);
    return res.status(500).json({
      message: "Order creation failed",
      error: err.message
    });
  }
}







export async function findeoder(req, res) {
  const user = req.user;

  
  if (!user) {
    return res.status(401).json({ message: "Please login first" });
  }

  try {

    const email = user.email;

    const orders = await Order.find({ user_email: email });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    return res.status(200).json({ count: orders.length, orders });

  } catch (err) {
    console.error("Error finding orders:", err);
    return res.status(500).json({
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
}





// GET /orders-simple
export async function getOrdersSimple(req, res) {
  try {
    const orders = await Order.find({}).lean();
    return res.status(200).json({ total: orders.length, orders });
  } catch (err) {
    console.error("Error fetching all orders:", err);
    return res.status(500).json({
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
}





// PATCH /admin/order/:order_id
export async function adminUpdateOrderStatus(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Please login first" });
    if (user.type !== "admin") {
      return res.status(403).json({ message: "Only admins can update order status" });
    }

    const { order_id } = req.params;
    if (!order_id) return res.status(400).json({ message: "order_id is required in params" });

    const { status } = req.body;
    if (typeof status !== "string" || !status.trim()) {
      return res.status(400).json({ message: "Valid status is required in body" });
    }

    const allowedStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(", ")}` });
    }

    const order = await Order.findOne({ order_id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status.toLowerCase();
    await order.save();

    // Telegram notification (non-blocking) using existing bot function
    (async () => {
      try {
        const userRecord = await User.findOne({ email: order.user_email });
        const telegramChatId = userRecord?.telegram_chat_id;
        if (telegramChatId) {
          // සාමාන්‍ය message payload එක
          const payload = {
            order_id: order.order_id,
            status: order.status,
            updated_at: new Date().toLocaleString(),
          };
          // ඔයාගේ bot එකේ තිබෙන function එකක් කැඳවන්න
          await sendOrderStatusUpdate(telegramChatId.toString(), payload);
        }
      } catch (botErr) {
        console.warn("Failed to send order status update via Telegram:", botErr?.message || botErr);
      }
    })();

    return res.status(200).json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Error updating order status:", err);
    return res.status(500).json({ message: "Failed to update status", error: err.message });
  }
}