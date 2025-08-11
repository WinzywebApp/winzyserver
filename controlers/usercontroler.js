import User from "../moduls/user.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config()
import VerificationCode from "../moduls/verification.js";
import { sendVerificationCode,sendPasswordResetCode, sendNewReferralNotification, sendUserSignupSuccess } from "../bot/bot.js"; 


const REFERRAL_REWARD = 25;

 // TTL schema model


export async function usercreat(req, res) {
  try {
    const {
      email,
      username,
      password,
      type,
      refaral_from,
      telegram_chat_id,
      verification_code,
    } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: "email, username and password are required" });
    }
    if (!telegram_chat_id || !verification_code) {
      return res.status(400).json({ message: "telegram_chat_id and verification_code required" });
    }

    const codeRecord = await VerificationCode.findOne({
      telegram_chat_id: telegram_chat_id.toString(),
      code: verification_code.toString(),
    });
    if (!codeRecord) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    let userType = "customer";
    if (type === "admin") {
      if (!req.user || req.user.type !== "admin") {
        return res.status(403).json({ message: "Only admins can create admin accounts" });
      }
      userType = "admin";
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const generateUniqueReferralCode = async (length = 6) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code;
      while (true) {
        code = '';
        for (let i = 0; i < length; i++) {
          code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        const exists = await User.findOne({ refaral_code: code });
        if (!exists) break;
      }
      return code;
    };
    const referralCode = await generateUniqueReferralCode();

    let initialCoinBalance = 0;
    let referrer; // 🔵 declare to use later
    if (refaral_from) {
      referrer = await User.findOne({ refaral_code: refaral_from });
      if (referrer) {
        if ((referrer.refaral_count || 0) < 5) {
          referrer.coin_balance = (referrer.coin_balance || 0) + REFERRAL_REWARD;
          referrer.refaral_count = (referrer.refaral_count || 0) + 1;
          await referrer.save();
        } else {
          console.log(`Referral reward limit reached for referrer ${referrer.user_id}`);
        }
        initialCoinBalance += REFERRAL_REWARD;
      } else {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }

    const lastUser = await User.findOne({}).sort({ _id: -1 });
    let newUserId;
    if (lastUser && lastUser.user_id) {
      const lastNumber = parseInt(lastUser.user_id.slice(9), 10);
      const next = lastNumber + 1;
      newUserId = `cooba_u_${next.toString().padStart(4, '0')}`;
    } else {
      newUserId = "cooba_u_0001";
    }

    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      type: userType,
      refaral_code: referralCode,
      refaral_from: refaral_from || null,
      coin_balance: initialCoinBalance,
      main_balance: 0,
      refaral_count: 0,
      user_id: newUserId,
      telegram_chat_id: telegram_chat_id,
    });

    await newUser.save();

    await VerificationCode.deleteMany({ telegram_chat_id: telegram_chat_id.toString() });

    // ✅ Send signup success message via Telegram
    await sendUserSignupSuccess(telegram_chat_id, {
      username,
      email,
      password
    });

    // ✅ 🔔 Notify Referrer via Bot (if applicable)
    if (referrer && referrer.telegram_chat_id) {
      await sendNewReferralNotification(referrer.telegram_chat_id, newUser, REFERRAL_REWARD);
    }

    return res.status(201).json({
      message: "User created and verified successfully",
      user_id: newUserId,
    });
  } catch (err) {
    console.error("usercreat error:", err);
    if (err.code === 11000) {
      if (err.message.includes("email")) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (err.message.includes("username")) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (err.message.includes("refaral_code")) {
        return res.status(400).json({ message: "Referral code collision, try again" });
      }
      if (err.message.includes("telegram_chat_id")) {
        return res.status(400).json({ message: "Telegram chat ID already registered" });
      }
    }
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}


 


 


export function userfinde(req,res){
         User.find().then(
            (userlist)=> {[
                res.json({
                    list:userlist
                })
            ]}
        )
    }




export function userdelete(req,res){
  const email = req.params.name;
  User.deleteOne({email}).then(
     ()=>{
      console.log("user delet sucess")
      res.json({
        massage:"User delet sucess"
      })
     }
  )
}; 



export function userlogin(req, res) {
  User.find({ email: req.body.email }).then((users) => {
    if (users.length === 0) {
      return res.json({
        message: "User not found",
      });
    } else {
      const user = users[0];
      const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);

      if (isPasswordCorrect) {
        const token = jwt.sign(
          {
            email: user.email,
            username: user.username,
            isblock: user.isblock,
            coin_balance: user.coin_balance,
            main_balance: user.main_balance,
            type: user.type,
            refaral_count: user.refaral_count,
            refaral_code: user.refaral_code,
            user_id: user.user_id,
            spinsToday: user.spinsToday,
            lastSpinAt: user.lastSpinAt,
            dailyWinnerDate: user.dailyWinnerDate,
            dailyQuizCount: user.dailyQuizCount,
            lastQuizAt: user.lastQuizAt,
            telegram_chat_id:user.telegram_chat_id,
          },
          process.env.JWT_KEY
        );

        return res.json({
          message: "User login success",
          token: token,
          user: {
            email: user.email,
            username: user.username,
            isblock: user.isblock,
            coin_balance: user.coin_balance,
            main_balance: user.main_balance,
            type: user.type,
            refaral_count: user.refaral_count,
            refaral_code: user.refaral_code,
            user_id: user.user_id,
            spinsToday: user.spinsToday,
            lastSpinAt: user.lastSpinAt,
            dailyWinnerDate: user.dailyWinnerDate,
            dailyQuizCount: user.dailyQuizCount,
            lastQuizAt: user.lastQuizAt,
            telegram_chat_id:user.telegram_chat_id,
          },
        });
      } else {
        return res.json({
          message: "Password is incorrect, please try again",
        });
      }
    }
  }).catch((err) => {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
    });
  });
}




export function isAdmin(req){
  if(req.user==null){
    return false
  }

  if(req.user.type != "admin"){
    return false
  }

  return true
}

export function isCustomer(req){
  if(req.user==null){
    return false
  }

  if(req.user.type != "customer"){
    return false
  }

  return true
}








  
  export default async function getUserProfile(req, res) {
  try {
    const decoded = req.user;

    if (!decoded || !decoded.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ user_id: decoded.user_id }).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      username: user.username,
      email: user.email,
      coin_balance: user.coin_balance,
      main_balance: user.main_balance,
      refaral_count: user.refaral_count,
      refaral_code: user.refaral_code,
      user_id: user.user_id,
      isblock: user.isblock,
      profileImage: user.profileImage || null,
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}






// 6-digit numeric code generator
// 6-digit numeric code generator
function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendVerificationCode(req, res) {
  try {
    const { telegram_chat_id } = req.body;

    if (!telegram_chat_id) {
      return res.status(400).json({ message: "telegram_chat_id is required" });
    }

    // Generate a fresh 6-digit code
    const code = generateSixDigitCode();

    // Remove any old active code for this chat_id
    await VerificationCode.deleteMany({ telegram_chat_id: telegram_chat_id.toString() });

    // Save the new verification code (auto-expires in 30s via TTL)
    const vc = new VerificationCode({
      telegram_chat_id: telegram_chat_id.toString(),
      code,
    });
    await vc.save();

    // Send the code via bot
    await sendVerificationCode(telegram_chat_id.toString(), code);

    return res.status(200).json({
      message: "Verification code saved & sent via bot",
      telegram_chat_id,
    });
  } catch (err) {
    
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}







// Password reset handler
export async function resetPassword(req, res) {
  try {
    const { telegram_chat_id, verification_code, new_password } = req.body;

    if (!telegram_chat_id || !verification_code || !new_password) {
      return res.status(400).json({ message: "telegram_chat_id, verification_code and new_password are required" });
    }

    // Find valid verification code record (not expired)
    const codeRecord = await VerificationCode.findOne({
      telegram_chat_id: telegram_chat_id.toString(),
      code: verification_code.toString(),
    });

    if (!codeRecord) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    // Find the user by telegram_chat_id
    const user = await User.findOne({ telegram_chat_id: telegram_chat_id.toString() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(new_password, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    // Delete used verification codes for this user/chat
    await VerificationCode.deleteMany({ telegram_chat_id: telegram_chat_id.toString() });

    // Optionally send confirmation message via bot
    await sendPasswordResetCode(telegram_chat_id.toString(), "✅ Your password has been successfully reset.");

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}