import express from 'express';
import { getAllBets, getUserBets, getAllWinners, selectWinnerByAdmin, placeBet } from '../controlers/betscontroler.js';

const betsrouter = express.Router();

// Place a new bet
betsrouter.post('/place', placeBet);
betsrouter.get('/my-bet',getUserBets);

betsrouter.get('/all',getAllBets);
betsrouter.post('/select-winner/:product_id',selectWinnerByAdmin)
betsrouter.get('/winner',getAllWinners);

export default betsrouter;  
 
