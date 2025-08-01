import express from "express";
import { adminUpdateOrderStatus, findeoder, getOrdersSimple, orderCreate } from "../controlers/oderconrtoler.js";

const oderRouter = express.Router();

oderRouter.post("/creat",orderCreate);
oderRouter.get('/view',findeoder);
oderRouter.get('/all',getOrdersSimple)
oderRouter.put('/update/:roder_id',adminUpdateOrderStatus);


export default oderRouter;  

