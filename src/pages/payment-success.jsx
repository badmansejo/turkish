import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../services/supabaseClient";

export default function PaymentSuccess() {
  const router = useRouter();
  const { reference } = router.query;

  useEffect(() => {
    if (!reference) return;

    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/paystack-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const data = await res.json();
        if (data.status === "success") {
          const { username, days } = data;

          // Grant VIP in Supabase
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + Number(days));

          await supabase
            .from("users")
            .update({ is_vip: true, vip_expiry: expiry })
            .eq("username", username);

          alert(`Payment verified! ${username} is now VIP until ${expiry.toDateString()}`);
          router.push("/"); // redirect to main page
        } else {
          alert("Payment verification failed: " + data.message);
        }
      } catch (err) {
        console.error(err);
        alert("Server error verifying payment");
      }
    };

    verifyPayment();
  }, [reference, router]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Verifying Payment...</h1>
      <p>Please wait, do not refresh the page.</p>
    </div>
  );
}
