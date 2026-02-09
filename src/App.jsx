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
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  const [freeTips, setFreeTips] = useState([]);
  const [vipTips, setVipTips] = useState([]);
  const [news, setNews] = useState([]);

  const isAdmin = user?.username === "badmansejo254";

  /* ---------- FETCH ALL DATA ---------- */
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

  useEffect(() => {
    fetchAll();
  }, []);

  /* ---------- LOGIN ---------- */
  const login = async () => {
    if (!username || !phone) {
      alert("Enter username and phone");
      return;
    }

    const { data } = await supabase
      .from("users")
      .upsert(
        { username, phone },
        { onConflict: "username" }
      )
      .select()
      .single();

    setUser(data);
  };

  /* ---------- ADD TIP ---------- */
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

  /* ---------- DELETE TIP ---------- */
  const deleteTip = async (id) => {
    await supabase.from("tips").delete().eq("id", id);
    fetchAll();
  };

  /* ---------- AUTO-CREATE + GRANT / REVOKE VIP ---------- */
  const toggleVip = async () => {
    const name = prompt("Enter username");
    if (!name) return;

    // Try fetch user
    let { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("username", name)
      .single();

    // If user does NOT exist → create
    if (!existingUser) {
      const { data: newUser } = await supabase
        .from("users")
        .insert({
          username: name,
          phone: "auto-created",
          is_vip: false
        })
        .select()
        .single();

      existingUser = newUser;
    }

    // Toggle VIP
    if (existingUser.is_vip) {
      await supabase
        .from("users")
        .update({ is_vip: false, vip_expiry: null })
        .eq("username", name);

      alert("VIP revoked");
    } else {
      const days = prompt("VIP duration (days)");
      if (!days) return;

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(days));

      await supabase
        .from("users")
        .update({
          is_vip: true,
          vip_expiry: expiry
        })
        .eq("username", name);

      alert("VIP granted");
    }
  };

  /* ---------- ADD NEWS ---------- */
  const addNews = async () => {
    const title = prompt("News title");
    const content = prompt("News content");
    if (!title || !content) return;

    await supabase.from("news").insert({ title, content });
    fetchAll();
  };

  /* ---------- DELETE NEWS ---------- */
  const deleteNews = async (id) => {
    await supabase.from("news").delete().eq("id", id);
    fetchAll();
  };

  return (
    <div className="app">
      <h1>
        Turkish Predictions <span>(Türk Tahminleri)</span>
        {isAdmin && <span className="admin-badge">ADMIN</span>}
      </h1>

      {!user && (
        <div className="login">
          <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Phone" onChange={(e) => setPhone(e.target.value)} />
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
          </main>

          {/* ADMIN */}
          {isAdmin && (
            <aside className="admin">
              <h2>Admin Panel</h2>
              <button onClick={() => addTip("free")}>➕ Add Free Tip</button>
              <button onClick={() => addTip("vip")}>⭐ Add VIP Tip</button>
              <button onClick={toggleVip}>🔑 Grant / Revoke VIP</button>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
