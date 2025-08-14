import BetItem from '../moduls/betitem.js';
import { DateTime } from 'luxon';

// 🔐 Helper to check if admin
function isAdmin(req, res) {
  if (!req.user || req.user.type !== "admin") {
    res.status(403).json({ message: "Access denied" });
    return false;
  }
  return true;
} 

// 🔢 Helper to generate product_id like winzy_bp_0001
async function generateUniqueProductId() {
  const count = await BetItem.countDocuments();
  const idNumber = (count + 1).toString().padStart(4, "0");
  return `cooba_bp_${idNumber}`;
}

// ✅ CREATE Product
// ✅ CREATE Product
export async function createBetItem(req, res) {
  if (!isAdmin(req, res)) return;

  try {
    const {
      name, description, image,
      coin_price, main_price,
      start_time, end_time
    } = req.body;

    const product_id = await generateUniqueProductId();

    // 🕐 Convert Lanka time to UTC using Luxon
    const startTimeUTC = DateTime.fromISO(start_time, { zone: 'Asia/Colombo' }).toUTC().toJSDate();
    const endTimeUTC = DateTime.fromISO(end_time, { zone: 'Asia/Colombo' }).toUTC().toJSDate();

    const newItem = new BetItem({
      product_id,
      name,
      description,
      image,
      coin_price,
      main_price,
      start_time: startTimeUTC,
      end_time: endTimeUTC,
    });

    await newItem.save();
    res.status(201).json({ message: "Product created", item: newItem });
  } catch (err) {
    res.status(500).json({ message: "Error creating product", error: err.message });
    console.log(err)
  }
}
 


// ✅ GET ALL Products
export async function getAllBetItems(req, res) {
  try {
    const items = await BetItem.find().sort({ start_time: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
}

// ✅ GET SINGLE Product by ID
export async function getBetItemById(req, res) {
  try {
    const item = await BetItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Product not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
}

// ✅ UPDATE Product
export async function updateBetItem(req, res) {
  if (!isAdmin(req, res)) return;

  try {
    const {
      name, description, image,
      coin_price, main_price,
      start_time, end_time
    } = req.body;

    const item = await BetItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Product not found" });

    item.name = name || item.name;
    item.description = description || item.description;
    item.image = image || item.image;
    item.coin_price = coin_price ?? item.coin_price;
    item.main_price = main_price ?? item.main_price;
    item.start_time = start_time ? new Date(start_time) : item.start_time;
    item.end_time = end_time ? new Date(end_time) : item.end_time;

    await item.save();
    res.json({ message: "Product updated", item });
  } catch (err) {
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
}

// ✅ DELETE Product
export async function deleteBetItem(req, res) {
  if (!isAdmin(req, res)) return;

  try {
    const item = await BetItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
}
