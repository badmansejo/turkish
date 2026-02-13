// pages/api/paystack.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  try {
    const { username, planName, amount, currency, days } = req.body;

    // Validate
    if (!username || !amount || !currency) {
      return res
        .status(400)
        .json({ status: false, message: "Missing required payment fields" });
    }

    // Convert to smallest currency unit
    // Paystack expects *100: e.g., 420 → 42000
    const paystackAmount = Math.round(amount * 100);

    // Build payload for Paystack
    const body = {
      amount: paystackAmount,
      email: `${username}@example.com`, // Paystack requires email
      currency: currency,
      metadata: {
        username,
        planName,
        days,
      },
    };

    // Call Paystack Initialize API
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(500).json({ status: false, message: data.message });
    }

    // Return the authorization URL to the front end
    return res.status(200).json({
      status: true,
      payment_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Paystack init error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}
