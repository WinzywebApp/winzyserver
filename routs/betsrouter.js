import express from 'express';
import { placeBetAndMaybeSelectWinner,   getAllBets, getUserBets, getAllWinners } from '../controlers/betscontroler.js';

const betsrouter = express.Router();

// Place a new bet
betsrouter.post('/place', placeBetAndMaybeSelectWinner);
betsrouter.get('/my-bet',getUserBets);

betsrouter.get('/all',getAllBets);
betsrouter.get('/winner',getAllWinners);

export default betsrouter;  
 
