// pages/api/paystack.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { username, planName, amount, currency, days } = req.body;

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `${username}@example.com`,
        amount: Math.floor(amount * 100), // Paystack expects kobo/cents
        currency,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`,
        metadata: {
          username,
          planName,
          days,
        },
      }),
    });

    const data = await response.json();

    if (!data.status) throw new Error(data.message);

    res.status(200).json({ status: "success", payment_url: data.data.authorization_url });
  } catch (err) {
    console.error("Paystack error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}
