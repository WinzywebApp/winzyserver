import express from "express";
import {
  createRequest,
  getUserRequests,
  getPendingRequestsByUsername,
  acceptRequest
} from "../controlers/walletcontroler.js";


const walletrouter = express.Router();

// User routes
walletrouter.post("/create", createRequest);
walletrouter.get("/user/", getUserRequests);

// Admin routes
walletrouter.get("/pending/:username", getPendingRequestsByUsername);
walletrouter.put("/accept/:request_id", acceptRequest);

export default walletrouter;
