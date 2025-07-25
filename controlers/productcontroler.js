import Product from "../moduls/product.js"
import { isAdmin } from "./usercontroler.js";



export async function productcreat(req, res) {
  if (!isAdmin) {
    return res.json({
      message: "Please login with an admin account",
    });
  }

  try {
    // Find the latest product with item_id like 'winzy_p0001'
    const lastProduct = await Product.findOne({
      product_id: { $regex: /^winzy_p\d{4}$/ }
    })
      .sort({ product_id: -1 })
      .exec();

    let newProductId;

    if (lastProduct && lastProduct.product_id) {
      const lastNumber = parseInt(lastProduct.product_id.slice(7), 10); // skip 'winzy_p'
      const nextNumber = lastNumber + 1;
      newProductId = `winzy_p${nextNumber.toString().padStart(4, "0")}`;
    } else {
      newProductId = "winzy_p0001"; // first product
    }

    const newProduct = new Product({
      ...req.body,
      product_id: newProductId, // ✅ correct usage
    });

    await newProduct.save();

    return res.json({
      message: "Product created successfully",
      product_id: newProductId,
    });
  } catch (err) {
    console.error("Error saving product:", err);
    return res.status(500).json({
      message: "Product creation failed",
      error: err.message,
    }); 
  }
}



export async function productFind(req, res) {
  
  try {
    // ✅ Get item_id from route params
    const product_id = req.params.product_id;

    // ✅ Find matching products
    const products = await Product.find({ product_id: product_id });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found for the given item_id" });
    }

    // ✅ Send response
    return res.status(200).json({
      count: products.length,
      list: products,
    });

  } catch (err) {
    console.error("Product fetch error:", err);
    return res.status(500).json({
      message: "Error fetching products",
      error: err.message,
    });
  }
  
}
 







export async function deleteProductByItemId(req, res) {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({ message: "product_id is required" }); // ✅ fixed message
    }

    const deletedProduct = await Product.findOneAndDelete({ product_id: product_id });

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      deleted_product_id: product_id
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    return res.status(500).json({
      message: "Failed to delete product",
      error: err.message
    });
  }
}






export async function updateProductByItemId(req, res) {
  try {
    // 🔐 Check if user is authenticated
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Please log in first" });
    }

    // 🔐 Check if user is an admin
    if (user.type !== "admin") {
      return res.status(403).json({ message: "Only admin can edit products" });
    }

    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({ message: "product_id is required" });
    }

    // Fields that can be updated
    const updatedData = {
      name: req.body.name,
      description: req.body.description,
      point_price: req.body.point_price,
      main_price: req.body.main_price,
      image: req.body.image,
      category:req.body.category,
      product_type:req.body.product_type
    };

    const updatedProduct = await Product.findOneAndUpdate(
      { product_id },
      { $set: updatedData },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(500).json({
      message: "Failed to update product",
      error: err.message
    });
  }
}




export async function getAllProducts(req, res) {
  try {
    const products = await Product.find(); // fetch all

    return res.status(200).json({
      count: products.length,
      products: products,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).json({
      message: "Failed to fetch products",
      error: err.message
    });
  }
}






export async function getCategoryTypeAProducts(req, res) {
  try {
    const category = req.query.cat;

    const validCategories = ["tech", "beauty", "perfume"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const products = await Product.find({
      product_type: "a",
      category: category,
    });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found for this category" });
    }

    return res.status(200).json({
      count: products.length,
      list: products,
    });

  } catch (err) {
    console.error("Error fetching products by category and type a:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}


 