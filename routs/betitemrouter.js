import express from 'express';
import {
  createBetItem,
  getAllBetItems,
  getBetItemById,
  updateBetItem,
  deleteBetItem
} from '../controlers/betitemcontroler.js';

const router = express.Router();

router.post('/creat', createBetItem);         // ➕ Admin Only
router.get('/', getAllBetItems);           // 📥 Public
router.get('/:id', getBetItemById);        // 📄 Public
router.put('/:id', updateBetItem);         // 📝 Admin Only
router.delete('/:id', deleteBetItem);      // ❌ Admin Only

export default router;
   


   