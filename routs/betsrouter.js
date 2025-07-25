import express from 'express';
import { placeBet,   getAllBets, getUserBets } from '../controlers/betscontroler.js';

const betsrouter = express.Router();

// Place a new bet
betsrouter.post('/place', placeBet);
betsrouter.get('/my-bet',getUserBets);

betsrouter.get('/all',getAllBets);

export default betsrouter;  
 
