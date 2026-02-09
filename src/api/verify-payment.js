// /pages/api/paystack.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  const { username, planName, amount, currency, days } = req.body;

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  const body = {
    email: username + "@example.com", // placeholder, Paystack needs email
    amount: currency === "USD" ? amount * 100 : amount * 100, // convert to kobo or cents
    currency,
    callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/PaymentSuccess?username=${username}&plan=${planName}&days=${days}`,
    metadata: {
      username,
      planName,
      days,
    },
  };

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.status) {
      return res.status(200).json({ status: "success", payment_url: data.data.authorization_url });
    } else {
      return res.status(400).json({ status: "error", message: data.message });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}
