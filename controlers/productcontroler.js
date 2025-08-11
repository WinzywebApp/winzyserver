import Product from "../moduls/product.js"
import { isAdmin } from "./usercontroler.js";


export async function createProduct(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Please log in first" });
    }
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admin can create products" });
    }

    const lastProduct = await Product.findOne({
      product_id: { $regex: /^cooba_p\d{4}$/ }
    })
      .sort({ product_id: -1 })
      .exec();

    let newProductId;
    if (lastProduct && lastProduct.product_id) {
      const lastNumber = parseInt(lastProduct.product_id.slice(7), 10); // skip 'winzy_p'
      const nextNumber = lastNumber + 1;
      newProductId = `cooba_p${nextNumber.toString().padStart(4, "0")}`;
    } else {
      newProductId = "cooba_p0001";
    }

    const {
      name,
      description,
      coin_price,
      main_price,
      image,
      quantaty, // frontend might be sending this typo; normalize below
      category,
      product_type,
    } = req.body;

    // Normalize quantity key (schema uses "quantaty" typo or correct? schema has "quantaty" so keep it)
    const productData = {
      name,
      description,
      coin_price: coin_price ?? 0,
      main_price: main_price ?? 0,
      image,
      category,
      product_type,
      product_id: newProductId,
      quantaty: typeof quantaty !== "undefined" ? quantaty : 0,
    };

    // Validate required
    if (!name || !description || !image || !category || !product_type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newProduct = new Product(productData);
    await newProduct.save();

    return res.status(201).json({
      message: "Product created successfully",
      product_id: newProductId,
      product: newProduct,
    });
  } catch (err) {
  
    if (err.code === 11000) {
      return res.status(409).json({ message: "Product ID conflict, try again" });
    }
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
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Please log in first" });
    }
    if (user.type !== "admin" && !isAdmin(user)) {
      return res.status(403).json({ message: "Only admin can delete products" });
    }

    const { product_id } = req.params;
    if (!product_id) {
      return res.status(400).json({ message: "product_id is required in params" });
    }

    const deletedProduct = await Product.findOneAndDelete({ product_id });
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      deleted_product_id: product_id,
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    return res.status(500).json({
      message: "Failed to delete product",
      error: err.message,
    });
  }
}






export async function editProductByItemId(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Please log in first" });
    }
    if (user.type !== "admin" && !isAdmin(user)) {
      return res.status(403).json({ message: "Only admin can edit products" });
    }

    const { product_id } = req.params;
    if (!product_id) {
      return res.status(400).json({ message: "product_id is required in params" });
    }

    // Build update object according to schema
    const updatedData = {};
    if (req.body.name) updatedData.name = req.body.name;
    if (req.body.description) updatedData.description = req.body.description;
    if (typeof req.body.coin_price !== "undefined") updatedData.coin_price = req.body.coin_price;
    if (typeof req.body.main_price !== "undefined") updatedData.main_price = req.body.main_price;
    if (req.body.image) updatedData.image = req.body.image;
    if (req.body.category) updatedData.category = req.body.category;
    if (req.body.product_type) updatedData.product_type = req.body.product_type;
    if (typeof req.body.quantaty !== "undefined") updatedData.quantaty = req.body.quantaty;

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update" });
    }

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
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(500).json({
      message: "Failed to update product",
      error: err.message,
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


 
