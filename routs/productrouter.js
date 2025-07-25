import express from "express"
import { deleteProductByItemId, getAllProducts, getCategoryTypeAProducts, productcreat, productFind, updateProductByItemId,  } from "../controlers/productcontroler.js";

const productrouter = express.Router();

productrouter.get('/viwe/:item_id',productFind);
productrouter.post('/creat',productcreat); 
productrouter.delete('/delete/:item_id', deleteProductByItemId);
productrouter.put('/edite/:item_id', updateProductByItemId);
productrouter.get('/',getAllProducts);
productrouter.get('/category', getCategoryTypeAProducts);

export default productrouter