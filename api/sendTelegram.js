export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, plan, txCode } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: "Telegram config missing" });
  }

  const message = `New VIP request!\nUsername: ${username}\nPlan: ${plan}\nTransaction: ${txCode}`;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Telegram send error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
}
