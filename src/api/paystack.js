import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  const { username, planName, amount, currency, days } = req.body;

  if (!username || !amount || !currency || !days) {
    return res.status(400).json({ status: "error", message: "Missing required fields" });
  }

  try {
    // Paystack expects amount in kobo for NGN or cents for USD, multiply by 100
    const amountInCents = Math.round(amount * 100);

    const body = {
      email: `${username}@turkishapp.com`, // dummy email for Paystack
      amount: amountInCents,
      currency: currency === "USD" ? "USD" : "KES",
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`,
      metadata: {
        username,
        days,
        planName,
        currency,
      },
    };

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await paystackRes.json();

    if (data.status) {
      return res.status(200).json({
        status: "success",
        payment_url: data.data.authorization_url,
      });
    } else {
      return res.status(400).json({
        status: "error",
        message: data.message || "Payment initialization failed",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}
