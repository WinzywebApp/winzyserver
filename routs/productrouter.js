import express from "express"
import { deleteProductByItemId, getAllProducts, getCategoryTypeAProducts, createProduct, productFind, editProductByItemId,  } from "../controlers/productcontroler.js";

const productrouter = express.Router();

productrouter.get('/viwe/:item_id',productFind);
productrouter.post('/creat',createProduct); 
productrouter.delete('/delete/:product_id', deleteProductByItemId);
productrouter.put('/edite/:product_id', editProductByItemId);
productrouter.get('/',getAllProducts);
productrouter.get('/category', getCategoryTypeAProducts);

export default productrouter;

