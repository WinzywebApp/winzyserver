// routes/spinRoutes.js
import { Router } from 'express';
import {  getDailyWinner, spin } from '../controlers/spincontroler.js';

const spinrouter = Router();

// ⚠️ req.user already injected from index.js / middleware
spinrouter.post('/spin', spin);
spinrouter.get('/daily-winner', getDailyWinner);

export default spinrouter;
