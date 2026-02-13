export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, plan, txCode } = req.body;

  if (!username || !plan || !txCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: "Bot token or chat ID not set" });
  }

  try {
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `🆕 New VIP request!\nUsername: ${username}\nPlan: ${plan}\nTransaction: ${txCode}`,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(500).json({ error: "Telegram API error", details: data });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Telegram send error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
}
