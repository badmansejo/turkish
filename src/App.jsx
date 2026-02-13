import { useEffect, useState } from "react";
import { supabase } from "./services/supabaseClient";
import "./App.css";

/* ---------------- COUNTDOWN ---------------- */
function Countdown({ expiry }) {
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(expiry) - new Date();
      setHoursLeft(diff > 0 ? Math.floor(diff / (1000 * 60 * 60)) : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiry]);

  return <span className="countdown">⏳ {hoursLeft} hrs left</span>;
}

/* ---------------- APP ---------------- */
export default function App() {
  const TILL_NUMBER = "8401046"; // M-Pesa till number
  const TELEGRAM_LINK = "https://t.me/TheeL3G3ND";
  const WHATSAPP_LINK = "https://wa.me/254118858615";

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  const [freeTips, setFreeTips] = useState([]);
  const [vipTips, setVipTips] = useState([]);
  const [news, setNews] = useState([]);
  const [vipRequests, setVipRequests] = useState([]);

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [txCode, setTxCode] = useState("");

  const isAdmin = user?.username === "badmansejo254";

  /* ---------- FETCH DATA ---------- */
  const fetchAll = async () => {
    const { data: free } = await supabase
      .from("tips")
      .select("*")
      .eq("type", "free")
      .order("created_at", { ascending: false });

    const { data: vip } = await supabase
      .from("tips")
      .select("*")
      .eq("type", "vip")
      .order("created_at", { ascending: false });

    const { data: newsData } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    setFreeTips(free || []);
    setVipTips(vip || []);
    setNews(newsData || []);
  };

  const fetchVipRequests = async () => {
    const { data } = await supabase
      .from("vip_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setVipRequests(data || []);
  };

  /* ---------- LOAD LOGIN INFO ---------- */
  useEffect(() => {
    fetchAll();
    fetchVipRequests();

    const savedUsername = localStorage.getItem("username");
    const savedPhone = localStorage.getItem("phone");

    if (savedUsername && savedPhone) {
      setUsername(savedUsername);
      setPhone(savedPhone);
    }
  }, []);

  /* ---------- LOGIN ---------- */
  const login = async () => {
    if (!username || !phone) {
      alert("Enter username and phone");
      return;
    }

    localStorage.setItem("username", username);
    localStorage.setItem("phone", phone);

    const { data } = await supabase
      .from("users")
      .upsert({ username, phone }, { onConflict: "username" })
      .select()
      .single();

    setUser(data);
  };

  /* ---------- TIPS / NEWS ---------- */
  const addTip = async (type) => {
    const text = prompt("Enter tip");
    if (!text) return;

    let expiry = null;
    if (type === "vip") {
      const days = prompt("VIP duration (days)");
      if (!days) return;
      expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(days));
    }

    await supabase.from("tips").insert({ text, type, expiry });
    fetchAll();
  };

  const deleteTip = async (id) => {
    await supabase.from("tips").delete().eq("id", id);
    fetchAll();
  };

  const addNews = async () => {
    const title = prompt("News title");
    const content = prompt("News content");
    if (!title || !content) return;

    await supabase.from("news").insert({ title, content });
    fetchAll();
  };

  const deleteNews = async (id) => {
    await supabase.from("news").delete().eq("id", id);
    fetchAll();
  };

  /* ---------- CONTACT ADMIN ---------- */
  const ContactAdminButtons = () => (
    <div style={{ marginTop: "20px" }}>
      <button
        onClick={() => window.open(TELEGRAM_LINK, "_blank")}
        style={{ marginRight: "10px" }}
      >
        Contact Admin via Telegram
      </button>
      <button onClick={() => window.open(WHATSAPP_LINK, "_blank")}>
        Contact Admin via WhatsApp
      </button>
    </div>
  );

  /* ---------- ADMIN VIP DASHBOARD ---------- */
  const AdminVipRequests = ({ vipRequests, fetchVipRequests }) => {
    const approveRequest = async (request) => {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + request.days);

      await supabase
        .from("users")
        .update({ is_vip: true, vip_expiry: expiry })
        .eq("username", request.username);

      await supabase.from("vip_requests").delete().eq("id", request.id);

      alert(`VIP approved for ${request.username}`);
      fetchVipRequests();
      fetchAll();
    };

    const deleteRequest = async (id) => {
      await supabase.from("vip_requests").delete().eq("id", id);
      fetchVipRequests();
    };

    return (
      <div style={{ marginTop: "20px" }}>
        <h3>Pending VIP Requests</h3>
        {vipRequests.length === 0 && <p>No pending requests.</p>}
        {vipRequests.map((r) => (
          <div
            key={r.id}
            style={{
              marginBottom: "10px",
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "6px",
            }}
          >
            <p>
              <b>Username:</b> {r.username}
            </p>
            <p>
              <b>Plan:</b>{" "}
              {r.plan === "1"
                ? "Daily - 10 KES"
                : r.plan === "2"
                ? "1 Week - 50 KES"
                : r.plan === "3"
                ? "1 Month - 260 KES"
                : r.plan === "4"
                ? "6 Months - 1300 KES"
                : r.plan === "5"
                ? "1 Year - 2500 KES"
                : "Lifetime - 5000 KES"}{" "}
              ({r.days} days)
            </p>
            <p>
              <b>Transaction Code:</b> {r.transaction_code}
            </p>
            <p>
              <b>Submitted:</b> {new Date(r.created_at).toLocaleString("en-GB")}
            </p>
            <button
              onClick={() => approveRequest(r)}
              style={{ marginRight: "10px" }}
            >
              Approve
            </button>
            <button onClick={() => deleteRequest(r.id)}>Delete</button>
          </div>
        ))}
      </div>
    );
  };

  /* ---------- MANUAL VIP GRANT/REVOKE ---------- */
  const grantVip = async (username, days) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);

    await supabase
      .from("users")
      .update({ is_vip: true, vip_expiry: expiry })
      .eq("username", username);

    alert(`${username} has been granted VIP for ${days} day(s).`);
    fetchAll();
  };

  const revokeVip = async (username) => {
    await supabase
      .from("users")
      .update({ is_vip: false, vip_expiry: null })
      .eq("username", username);

    alert(`${username}'s VIP has been revoked.`);
    fetchAll();
  };

  /* ---------- APP LAYOUT ---------- */
  return (
    <div className="app">
      <h1>
        Turkish Predictions <span>(Türk Tahminleri)</span>
        {isAdmin && <span className="admin-badge">ADMIN</span>}
      </h1>

      {!user && (
        <div className="login">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={login}>Login</button>
        </div>
      )}

      {user && (
        <div className="layout">
          {/* NEWS */}
          <aside className="news">
            <h2>Updates</h2>
            {isAdmin && <button onClick={addNews}>➕ Add News</button>}
            {news.map((n) => (
              <div key={n.id} className="news-item">
                <b>{n.title}</b>
                <p>{n.content}</p>
                {isAdmin && (
                  <button onClick={() => deleteNews(n.id)}>❌ Delete</button>
                )}
              </div>
            ))}
          </aside>

          {/* TIPS */}
          <main>
            <h2>Free Tips</h2>
            {freeTips.map((t) => (
              <div key={t.id} className="tip">
                {t.text}
                {isAdmin && <button onClick={() => deleteTip(t.id)}>❌</button>}
              </div>
            ))}

            <h2>VIP Tips</h2>
            {!user.is_vip && <p className="locked">🔒 VIP only</p>}
            {user.is_vip &&
              vipTips.map((t) => (
                <div key={t.id} className="tip vip">
                  {t.text} <Countdown expiry={t.expiry} />
                  {isAdmin && <button onClick={() => deleteTip(t.id)}>❌</button>}
                </div>
              ))}

            {/* Become VIP */}
            {!user.is_vip && (
              <>
                <button
                  onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                  style={{ fontWeight: "bold", marginTop: "20px" }}
                >
                  🔓 Become VIP
                </button>

                {showPaymentOptions && (
                  <div style={{ marginTop: "20px" }}>
                    <h3>Select Payment Option</h3>
                    <button
                      onClick={() => setShowPaymentForm(!showPaymentForm)}
                      style={{ marginBottom: "10px", width: "100%" }}
                    >
                      1. Manual M-Pesa
                    </button>

                    {showPaymentForm && (
                      <div
                        style={{
                          marginTop: "10px",
                          border: "1px solid #ccc",
                          padding: "15px",
                          borderRadius: "8px",
                        }}
                      >
                        <h4>Manual M-Pesa Payment</h4>
                        <p>
                          Pay via M-Pesa using Till Number: <b>{TILL_NUMBER}</b>
                        </p>
                        <p>Select a VIP plan and enter your transaction code:</p>

                        <div className="vip-plan-buttons">
                          {[
                            { id: "1", label: "Daily", amount: 10, days: 1 },
                            { id: "2", label: "1 Week", amount: 50, days: 7 },
                            { id: "3", label: "1 Month", amount: 260, days: 30 },
                            { id: "4", label: "6 Months", amount: 1300, days: 180 },
                            { id: "5", label: "1 Year", amount: 2500, days: 365 },
                            { id: "6", label: "Lifetime", amount: 5000, days: 36500 },
                          ].map((plan) => (
                            <button
                              key={plan.id}
                              className={selectedPlan?.id === plan.id ? "selected" : ""}
                              onClick={() => setSelectedPlan(plan)}
                            >
                              {plan.label} - {plan.amount} KES
                            </button>
                          ))}
                        </div>

                        {selectedPlan && (
                          <p>
                            Selected Plan: <b>{selectedPlan.label}</b> | Amount:{" "}
                            <b>{selectedPlan.amount} KES</b> | Duration:{" "}
                            <b>{selectedPlan.days} days</b>
                          </p>
                        )}

                        <input
                          type="text"
                          value={txCode}
                          onChange={(e) => setTxCode(e.target.value)}
                          placeholder="Enter your M-Pesa code"
                        />

                        <button
                          style={{ marginTop: "15px", width: "100%" }}
                          onClick={async () => {
                            if (!selectedPlan || !txCode) {
                              alert(
                                "Please select a plan and enter transaction code"
                              );
                              return;
                            }

                            // Save VIP request
                            await supabase.from("vip_requests").insert({
                              username: user.username,
                              transaction_code: txCode,
                              plan: selectedPlan.id,
                              days: selectedPlan.days,
                            });

                            fetchVipRequests();

                            // Send Telegram notification via serverless function
                            try {
                              await fetch("/api/sendTelegram", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  username: user.username,
                                  plan: selectedPlan.label,
                                  txCode,
                                }),
                              });
                            } catch (err) {
                              console.error("Telegram send error:", err);
                            }

                            alert("Payment submitted! Wait for admin approval.");

                            setSelectedPlan(null);
                            setTxCode("");
                            setShowPaymentForm(false);
                          }}
                        >
                          Submit Payment
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Contact Admin Always */}
            <ContactAdminButtons />
          </main>

          {/* ADMIN PANEL */}
          {isAdmin && (
            <aside className="admin">
              <h2>Admin Panel</h2>
              <button onClick={() => addTip("free")}>➕ Add Free Tip</button>
              <button onClick={() => addTip("vip")}>⭐ Add VIP Tip</button>

              <div style={{ marginTop: "20px" }}>
                <h3>Manual VIP Control</h3>
                <input type="text" placeholder="Username" id="manual-vip-username" />
                <input type="number" placeholder="VIP days" id="manual-vip-days" />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      const usernameInput = document.getElementById(
                        "manual-vip-username"
                      ).value;
                      const daysInput = Number(
                        document.getElementById("manual-vip-days").value
                      );
                      if (!usernameInput || !daysInput) {
                        alert("Enter username and days");
                        return;
                      }
                      grantVip(usernameInput, daysInput);
                    }}
                  >
                    Grant VIP
                  </button>
                  <button
                    onClick={() => {
                      const usernameInput = document.getElementById(
                        "manual-vip-username"
                      ).value;
                      if (!usernameInput) {
                        alert("Enter username");
                        return;
                      }
                      revokeVip(usernameInput);
                    }}
                  >
                    Revoke VIP
                  </button>
                </div>
              </div>

              {/* VIP Requests */}
              <AdminVipRequests
                vipRequests={vipRequests}
                fetchVipRequests={fetchVipRequests}
              />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
