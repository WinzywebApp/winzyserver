import express from "express";
import { getAdStats, watchAd } from "../controlers/adscontroler.js";

const adsrouter = express.Router();

adsrouter.post("/watchAd", watchAd);
adsrouter.get("/stats", getAdStats ) 

export default adsrouter;
