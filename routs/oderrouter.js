import express from "express";
import { findeoder, orderCreate } from "../controlers/oderconrtoler.js";

const oderRouter = express.Router();

oderRouter.post("/creat",orderCreate);
oderRouter.get('/view',findeoder);


export default oderRouter;  