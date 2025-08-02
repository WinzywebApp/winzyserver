import express from "express";
import {
  createRequest,
  getUserRequests,
  getPendingRequestsByUsername,
  acceptRequest,
  deleteRequest,
  adminDeleteRequest,
  getAllPaymentRequests
} from "../controlers/walletcontroler.js";


const walletrouter = express.Router();

// User routes
walletrouter.post("/create", createRequest);
walletrouter.get("/reqwest/", getUserRequests);
walletrouter.delete("/delete/:request_id", deleteRequest);
// Admin routes
walletrouter.get("/pending/:username", getPendingRequestsByUsername);
walletrouter.put("/accept/:request_id", acceptRequest);
walletrouter.delete("/Adelete/:request_id", adminDeleteRequest);
walletrouter.get("/all",getAllPaymentRequests);
export default walletrouter;


