import express, { Router } from "express"
import { createGiftCode, deleteGiftCode, getAllGiftCodes, redeemGiftCode, updateGiftCode } from "../controlers/giftcodecontroler.js";


const giftcoderouter = express.Router();

giftcoderouter.post('/creat',createGiftCode);
giftcoderouter.post('/',redeemGiftCode);
giftcoderouter.delete('/:id',deleteGiftCode);
giftcoderouter.put('/:id',updateGiftCode);
giftcoderouter.get('/',getAllGiftCodes);


export default giftcoderouter