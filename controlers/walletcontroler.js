import PaymentRequest from "../moduls/wallet.js";
import User from "../moduls/user.js";
import { DateTime } from "luxon";



// ✅ ID Generator: Auto-generate request_id like pr_00001
const generateRequestId = async () => {
  const lastRequest = await PaymentRequest.findOne().sort({ _id: -1 });

  let newId;
  if (lastRequest && lastRequest.request_id) {
    const lastNumber = parseInt(lastRequest.request_id.slice(9), 10); // Extract number after "winzy_pr_"
    const next = lastNumber + 1;
    newId = `winzy_pr_${next.toString().padStart(4, "0")}`;
  } else {
    newId = "winzy_pr_0001";
  }

  return newId;
};

// 🧾 Create a new payment request
export const createRequest = async (req, res) => {
  try {
    const { amount } = req.body;

    const user = await User.findOne({ user_id: req.user.user_id });
    if (!user) return res.status(404).json({ message: "User not found" });

    const request_id = await generateRequestId();

    const request = await PaymentRequest.create({
      request_id,
      user_id: user.user_id,
      username: user.username,
      amount,
      status: "requested",
      created_at: DateTime.now().toISO(),
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({
        message: "Duplicate request_id. Please try again.",
        error: err.message,
      });
    } else {
      res.status(500).json({
        message: "Error creating request",
        error: err.message,
      });
    }
  }
};




// 📄 Get all requests by user_id (User Profile)
export const getUserRequests = async (req, res) => {
  try {
    const user_id = req.user.user_id; // ✅ directly assign user_id
    const requests = await PaymentRequest.find({ user_id }).sort({ created_at: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching requests", error: err.message });
  }
};

// 🔎 Get all pending requests by username (Admin)
export const getPendingRequestsByUsername = async (req, res) => {
  try {
    if (req.user.type !== "admin") return res.status(403).json({ message: "Access denied" });

    const { username } = req.params;
    const requests = await PaymentRequest.find({ username, status: "requested" });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching requests", error: err.message });
  }
};

// ✅ Accept request & update user balance (Admin)
export const acceptRequest = async (req, res) => {
  try {
    if (req.user.type !== "admin") return res.status(403).json({ message: "Only admins allowed" });

    const { request_id } = req.params;
    const request = await PaymentRequest.findOne({ request_id });

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status === "accepted") return res.status(400).json({ message: "Already accepted" });

    const user = await User.findOne({ user_id: request.user_id });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update user balance
    user.main_balance += request.amount;
    await user.save();

    // Update request status
    request.status = "accepted";
    await request.save();

    res.json({ message: "Request accepted and balance updated", request });
  } catch (err) {
    res.status(500).json({ message: "Error accepting request", error: err.message });
  }
};
