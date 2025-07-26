import User from "../moduls/user.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config()

// Referral reward amount

const REFERRAL_REWARD = 5;

export async function usercreat(req, res) {
  try {
    const newUserData = req.body;

    // Check admin creation
    if (newUserData.type === "admin") {
      if (!req.user || req.user.type !== "admin") {
        return res.status(403).json({ message: "Only admins can create admin accounts" });
      }
    } else {
      newUserData.type = "customer";
    }

    // Password hashing
    newUserData.password = bcrypt.hashSync(newUserData.password, 10);

    // 🔁 Generate Unique Referral Code (Inline function)
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

    newUserData.refaral_code = await generateUniqueReferralCode();

    // Referral reward logic
    if (newUserData.refaral_from) {
      const referrer = await User.findOne({ refaral_code: newUserData.refaral_from });

      if (referrer) {
        // Add coin to referrer
        referrer.coin_balance += REFERRAL_REWARD;
        referrer.refaral_count += 1;
        await referrer.save();

        // Add coin to referred user
        newUserData.coin_balance = (newUserData.coin_balance || 0) + REFERRAL_REWARD;
      } else {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }

    // 🔢 Generate user_id
    const lastUser = await User.findOne({}).sort({ _id: -1 });
    let newUserId;
    if (lastUser && lastUser.user_id) {
      const lastNumber = parseInt(lastUser.user_id.slice(9), 10);
      const next = lastNumber + 1;
      newUserId = `winzy_u_${next.toString().padStart(4, '0')}`;
    } else {
      newUserId = "winzy_u_0001";
    }
    newUserData.user_id = newUserId;

    // Save new user
    const newUser = new User(newUserData);
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });

  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      if (err.message.includes('email')) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      if (err.message.includes('username')) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    res.status(500).json({ message: 'Server error' });
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
