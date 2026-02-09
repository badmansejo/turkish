import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ status: "error", message: "No reference provided" });
  }

  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await paystackRes.json();

    if (data.status && data.data.status === "success") {
      // Extract metadata sent when creating the transaction
      const metadata = data.data.metadata;
      const username = metadata.username;
      const days = metadata.days;

      return res.status(200).json({
        status: "success",
        username,
        days,
        message: "Payment verified",
      });
    } else {
      return res.status(400).json({
        status: "error",
        message: data.message || "Payment not successful",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}
