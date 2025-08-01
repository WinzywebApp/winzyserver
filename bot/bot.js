// botController.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ Missing TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

/**
 * Generic function to send a message via Telegram bot
 * @param {string|number} chatId - Telegram chat ID
 * @param {string} message - Text message (Markdown supported)
 * @param {object|null} replyMarkup - Optional inline keyboard markup
 */
export async function sendBotMessage(chatId, message, replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId.toString(),
      text: message,
      parse_mode: "Markdown",
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    await axios.post(TELEGRAM_API, payload);
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error?.response?.data || error.message);
  }
}

/**
 * Send verification code
 */
export async function sendVerificationCode(chatId, code) {
  const msg = `🔐 *Your verification code:* \`${code}\`\n⌛ _This code is valid for 30 seconds._`;
  const replyMarkup = {
    inline_keyboard: [
      [{ text: "📋 Copy Code", callback_data: `resend_code:${code}` }],
    ],
  };
  await sendBotMessage(chatId, msg, replyMarkup);
}

/**
 * Send order placed message
 */
export async function sendOrderPlaced(chatId, order) {
  const msg = `🛒 *Order Placed Successfully!*\n\n` +
              `📦 *Order ID:* \`${order.order_id}\`\n` +
              `🛍 *Item:* ${order.product_name}\n` +
              `💰 *Price:* ${order.price} ${order.currency}\n` +
              `🟢 *Status:* ${order.status || "pending"}\n` +
              `📅 *Date:* ${order.date}`;
  await sendBotMessage(chatId, msg);
}


/**
 * Send bet placed message
 */
export async function sendBetPlaced(chatId, bet) {
  const msg = `🎯 *Bet Placed!*\n\n` +
              `🎲 *Bet ID:* \`${bet.bet_id}\`\n` +
              `🏆 *Product:* ${bet.product_name}\n` +
              `💵 *Bet Price:* ${bet.product_price}\n` +
              `📅 *Date:* ${bet.date}`;
  await sendBotMessage(chatId, msg);
}

/**
 * Send bet winner notification
 */
export async function sendBetWinner(chatId, winner) {
  const msg = `🏆 *Congratulations!*\n\n` +
              `🎁 You won: *${winner.product_name}*\n` +
              `💵 Price: ${winner.product_price}\n` +
              `🎫 Bet Code: \`${winner.bet_code}\`\n` +
              `📅 Date: ${winner.date}`;
  await sendBotMessage(chatId, msg);
}



// botController.js (ඔයාගේම එකේ)
export async function sendOrderStatusUpdate(chatId, { order_id, status, updated_at }) {
  const msg = `📦 *Order Status Updated*\n\n` +
              `🆔 Order ID: \`${order_id}\`\n` +
              `🔄 New Status: ${status}\n` +
              `🕒 Updated At: ${updated_at}`;
  await sendBotMessage(chatId, msg);
}


/**
 * Payment request accepted notification
 */
export async function sendPaymentAccepted(chatId, { request_id, amount, new_balance, timestamp }) {
  const msg = `✅ *Payment Request Accepted*\n\n` +
              `🆔 Request ID: \`${request_id}\`\n` +
              `💰 Amount Credited: ${amount}\n` +
              `💼 New Main Balance: ${new_balance}\n` +
              `📅 Date: ${timestamp}`;
  await sendBotMessage(chatId, msg);
}

/**
 * Send password reset code
 */
export async function sendPasswordResetCode(chatId, code) {
  const msg = `🔑 *Password Reset Code:* \`${code}\`\n⌛ _Valid for 10 minutes._`;
  await sendBotMessage(chatId, msg);
}
