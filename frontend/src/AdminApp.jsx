import { useState, useEffect } from "react";

const API = "http://localhost:8080/api/admin";

const api = {
  async req(path, opts = {}) {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(API + path, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  },
  get: (p) => api.req(p),
  post: (p, b) => api.req(p, { method: "POST", body: JSON.stringify(b) }),
  put: (p, b) => api.req(p, { method: "PUT", body: JSON.stringify(b) }),
};

const S = {
  app: { fontFamily: "system-ui,sans-serif", minHeight: "100vh", background: "#f9fafb", color: "#111" },
  topbar: { background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  sidebar: { width: 220, background: "#fff", borderRight: "1px solid #e5e7eb", minHeight: "calc(100vh - 56px)", padding: "1rem 0" },
  main: { flex: 1, padding: "2rem" },
  layout: { display: "flex" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.25rem" },
  statCard: (color) => ({ background: color, borderRadius: 12, padding: "1.25rem", color: "#fff" }),
  btn: (v = "default") => ({ padding: "7px 16px", borderRadius: 8, border: v === "primary" ? "none" : "1px solid #d1d5db", cursor: "pointer", fontSize: 13, fontWeight: 500, background: v === "primary" ? "#111" : "#fff", color: v === "primary" ? "#fff" : "#111" }),
  btnSm: (v = "default") => ({ ...S.btn(v), padding: "4px 10px", fontSize: 12 }),
  input: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" },
  badge: (c) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: c === "green" ? "#dcfce7" : c === "red" ? "#fee2e2" : c === "yellow" ? "#fef9c3" : "#f3f4f6", color: c === "green" ? "#166534" : c === "red" ? "#991b1b" : c === "yellow" ? "#854d0e" : "#374151" }),
  nav: (a) => ({ display: "flex", alignItems: "center", gap: 8, padding: "8px 1.25rem", cursor: "pointer", fontSize: 14, color: a ? "#111" : "#6b7280", background: a ? "#f3f4f6" : "transparent", fontWeight: a ? 500 : 400, transition: "all .1s" }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", fontSize: 12, color: "#6b7280", fontWeight: 500, borderBottom: "1px solid #e5e7eb" },
  td: { padding: "12px", fontSize: 13, borderBottom: "1px solid #f3f4f6" },
};

// ─── Login ────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function login() {
    try {
      const res = await api.post("/login", form);
      localStorage.setItem("admin_token", res.token);
      onLogin(res.name);
    } catch { setError("Invalid credentials"); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ ...S.card, width: 380 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>📡 Admin Portal</h2>
        <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 13 }}>USSD Platform management</p>
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input style={S.input} placeholder="Admin email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <input style={S.input} placeholder="Password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <button style={{ ...S.btn("primary"), padding: "10px" }} onClick={login}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Overview ───────────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get("/stats").then(setStats).catch(() => {}); }, []);

  if (!stats) return <p style={{ color: "#6b7280" }}>Loading stats…</p>;

  const cards = [
    { label: "Total Tenants", value: stats.totalTenants, sub: `${stats.activeTenants} active`, color: "#6366f1" },
    { label: "USSD Apps", value: stats.totalApps, sub: `${stats.activeApps} live`, color: "#0ea5e9" },
    { label: "Total Sessions", value: stats.totalSessions?.toLocaleString(), sub: "all time", color: "#10b981" },
    { label: "Monthly Revenue", value: `GHS ${Number(stats.monthlyRevenueGhs || 0).toFixed(2)}`, sub: "this month", color: "#f59e0b" },
  ];

  return (
    <div>
      <h2 style={{ margin: "0 0 1.5rem", fontWeight: 500 }}>Platform Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={S.statCard(c.color)}>
            <p style={{ margin: "0 0 4px", fontSize: 12, opacity: 0.85 }}>{c.label}</p>
            <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 600 }}>{c.value}</p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      {stats.planDistribution && (
        <div style={S.card}>
          <p style={{ margin: "0 0 12px", fontWeight: 500, fontSize: 14 }}>Plan Distribution</p>
          <div style={{ display: "flex", gap: 24 }}>
            {Object.entries(stats.planDistribution).map(([plan, count]) => (
              <div key={plan} style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600 }}>{count}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{plan}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tenants ──────────────────────────────────────────────────────────────────
function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setTenants(await api.get("/tenants")); } catch {}
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await api.put(`/tenants/${id}/status`, { status });
    load();
  }

  async function changePlan(id, plan) {
    await api.put(`/tenants/${id}/plan`, { plan });
    load();
  }

  const statusColor = { ACTIVE: "green", SUSPENDED: "red", TRIAL: "yellow" };
  const planColor = { FREE: "default", BASIC: "yellow", PRO: "green", ENTERPRISE: "green" };

  const filtered = tenants.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, fontWeight: 500 }}>Tenants ({tenants.length})</h2>
        <input style={{ ...S.input, width: 240 }} placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {["Company", "Email", "Plan", "Status", "Sessions", "Apps", "Joined", "Actions"].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#6b7280" }}>Loading…</td></tr>
            ) : filtered.map(t => (
              <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => setSelected(t)}>
                <td style={S.td}><strong>{t.name}</strong></td>
                <td style={{ ...S.td, color: "#6b7280" }}>{t.email}</td>
                <td style={S.td}><span style={S.badge(planColor[t.plan] || "default")}>{t.plan}</span></td>
                <td style={S.td}><span style={S.badge(statusColor[t.status] || "default")}>{t.status}</span></td>
                <td style={S.td}>{t.sessionsThisMonth}</td>
                <td style={S.td}>{t.appCount}</td>
                <td style={{ ...S.td, color: "#6b7280" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td style={S.td} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {t.status !== "SUSPENDED" ? (
                      <button style={S.btnSm("danger")} onClick={() => updateStatus(t.id, "SUSPENDED")}
                        title="Suspend">🚫</button>
                    ) : (
                      <button style={S.btnSm("primary")} onClick={() => updateStatus(t.id, "ACTIVE")}
                        title="Activate">✓</button>
                    )}
                    <select style={{ fontSize: 12, padding: "3px 6px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff" }}
                      value={t.plan}
                      onChange={e => changePlan(t.id, e.target.value)}
                      onClick={e => e.stopPropagation()}>
                      {["FREE", "BASIC", "PRO", "ENTERPRISE"].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tenant detail modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ ...S.card, width: 560, maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{selected.name}</h3>
              <button style={S.btnSm()} onClick={() => setSelected(null)}>✕</button>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6b7280" }}>{selected.email}</p>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>Joined {new Date(selected.createdAt).toLocaleDateString()}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280" }}>PLAN</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{selected.plan}</p>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280" }}>STATUS</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{selected.status}</p>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280" }}>SESSIONS THIS MONTH</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{selected.sessionsThisMonth}</p>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280" }}>APPS</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{selected.appCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Revenue ──────────────────────────────────────────────────────────────────
function Revenue() {
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { api.get("/invoices").then(setInvoices).catch(() => {}); }, []);

  const filtered = filter === "ALL" ? invoices : invoices.filter(i => i.status === filter);
  const total = filtered.filter(i => i.status === "PAID").reduce((s, i) => s + Number(i.amountGhs), 0);

  const statusColor = { PAID: "green", PENDING: "yellow", FAILED: "red", VOID: "default" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 500 }}>Revenue & Invoices</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Total collected: <strong>GHS {total.toFixed(2)}</strong></p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL", "PAID", "PENDING", "FAILED"].map(s => (
            <button key={s} style={{ ...S.btnSm(filter === s ? "primary" : "default") }} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>{["Invoice #", "Tenant", "Amount (GHS)", "Status", "Date", "Paid At"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id}>
                <td style={S.td}><code style={{ fontSize: 12 }}>{inv.invoiceNumber}</code></td>
                <td style={S.td}>{inv.tenantName}</td>
                <td style={{ ...S.td, fontWeight: 500 }}>GHS {Number(inv.amountGhs).toFixed(2)}</td>
                <td style={S.td}><span style={S.badge(statusColor[inv.status])}>{inv.status}</span></td>
                <td style={{ ...S.td, color: "#6b7280" }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td style={{ ...S.td, color: "#6b7280" }}>{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#6b7280" }}>No invoices</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [adminName, setAdminName] = useState(null);
  const [page, setPage] = useState("overview");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) setAdminName("Admin");
  }, []);

  if (!adminName) return <AdminLogin onLogin={setAdminName} />;

  const nav = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "tenants", label: "Tenants", icon: "🏢" },
    { id: "revenue", label: "Revenue", icon: "💰" },
  ];

  return (
    <div style={S.app}>
      <div style={S.topbar}>
        <strong style={{ fontSize: 15 }}>📡 USSD Platform Admin</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{adminName}</span>
          <button style={S.btnSm()} onClick={() => { localStorage.removeItem("admin_token"); setAdminName(null); }}>Sign out</button>
        </div>
      </div>
      <div style={S.layout}>
        <div style={S.sidebar}>
          {nav.map(n => (
            <div key={n.id} style={S.nav(page === n.id)} onClick={() => setPage(n.id)}>
              <span>{n.icon}</span>{n.label}
            </div>
          ))}
        </div>
        <div style={S.main}>
          {page === "overview" && <Overview />}
          {page === "tenants" && <Tenants />}
          {page === "revenue" && <Revenue />}
        </div>
      </div>
    </div>
  );
}
