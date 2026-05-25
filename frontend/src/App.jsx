import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080/api";

const api = {
  async request(path, opts = {}) {
    const token = localStorage.getItem("token");
    const res = await fetch(API_BASE + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  },
  get: (path) => api.request(path),
  post: (path, body) => api.request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => api.request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => api.request(path, { method: "DELETE" }),
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "var(--color-background-tertiary)", color: "var(--color-text-primary)" },
  topbar: { background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontWeight: 600, fontSize: 16, letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: 8 },
  badge: (color) => ({ background: `var(--color-background-${color})`, color: `var(--color-text-${color})`, fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }),
  btn: (variant = "default") => ({
    padding: "7px 16px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all .15s",
    background: variant === "primary" ? "var(--color-text-primary)" : "transparent",
    color: variant === "primary" ? "var(--color-background-primary)" : "var(--color-text-primary)",
    borderColor: variant === "primary" ? "transparent" : "var(--color-border-secondary)",
  }),
  btnSm: (variant = "default") => ({ ...S.btn(variant), padding: "4px 12px", fontSize: 12 }),
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "1.25rem" },
  input: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" },
  label: { fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4, display: "block" },
  layout: { display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 56px)" },
  sidebar: { background: "var(--color-background-primary)", borderRight: "0.5px solid var(--color-border-tertiary)", padding: "1rem 0" },
  main: { padding: "2rem" },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "8px 1.25rem", cursor: "pointer", fontSize: 14, borderRadius: 0, color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", background: active ? "var(--color-background-secondary)" : "transparent", fontWeight: active ? 500 : 400, transition: "all .1s" }),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", companyName: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true); setError("");
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await api.post(path, form);
      localStorage.setItem("token", res.token);
      onLogin(res.user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  const f = (k) => ({ value: form[k], onChange: (e) => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background-tertiary)" }}>
      <div style={{ ...S.card, width: 400, maxWidth: "90vw" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ ...S.logo, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>📡</span> USSD Platform
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            {mode === "login" ? "Sign in to your account" : "Create your company account"}
          </p>
        </div>

        {error && <div style={{ background: "var(--color-background-danger)", color: "var(--color-text-danger)", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && <>
            <div><label style={S.label}>Full name</label><input style={S.input} {...f("fullName")} /></div>
            <div><label style={S.label}>Company name</label><input style={S.input} {...f("companyName")} /></div>
          </>}
          <div><label style={S.label}>Email</label><input style={S.input} type="email" {...f("email")} /></div>
          <div><label style={S.label}>Password</label><input style={S.input} type="password" {...f("password")} /></div>
          {mode === "register" && <div><label style={S.label}>Phone (optional)</label><input style={S.input} {...f("phone")} /></div>}
        </div>

        <button style={{ ...S.btn("primary"), width: "100%", marginTop: 20, padding: "10px 16px" }} onClick={submit} disabled={loading}>
          {loading ? "Please wait…" : (mode === "login" ? "Sign in" : "Create account")}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, marginTop: 16, color: "var(--color-text-secondary)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "var(--color-text-primary)", cursor: "pointer", fontWeight: 500 }}
            onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Apps List ────────────────────────────────────────────────────────────────
function AppsPage() {
  const [apps, setApps] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", shortCode: "", gatewayType: "AFRICASTALKING" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setApps(await api.get("/apps")); } catch {}
    setLoading(false);
  }

  async function createApp() {
    try {
      await api.post("/apps", form);
      setShowCreate(false);
      setForm({ name: "", description: "", shortCode: "", gatewayType: "AFRICASTALKING" });
      load();
    } catch (e) { alert(e.message); }
  }

  const statusColor = { ACTIVE: "success", DRAFT: "warning", PAUSED: "danger" };
  const f = (k) => ({ value: form[k], onChange: (e) => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>USSD Apps</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Manage and deploy your USSD applications</p>
        </div>
        <button style={S.btn("primary")} onClick={() => setShowCreate(true)}>+ New app</button>
      </div>

      {showCreate && (
        <div style={{ ...S.card, marginBottom: "1.5rem", border: "1px solid var(--color-border-info)" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 500 }}>Create new app</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={S.label}>App name *</label><input style={S.input} {...f("name")} /></div>
            <div><label style={S.label}>Short code (e.g. *714#)</label><input style={S.input} {...f("shortCode")} /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Description</label><input style={S.input} {...f("description")} /></div>
            <div>
              <label style={S.label}>Gateway</label>
              <select style={S.select} {...f("gatewayType")}>
                <option value="AFRICASTALKING">Africa's Talking</option>
                <option value="HUBTEL">Hubtel</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button style={S.btn("primary")} onClick={createApp}>Create app</button>
            <button style={S.btn()} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: "var(--color-text-secondary)" }}>Loading…</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {apps.map(app => (
            <div key={app.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 15 }}>{app.name}</p>
                  {app.shortCode && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{app.shortCode}</p>}
                </div>
                <span style={S.badge(statusColor[app.status] || "warning")}>{app.status}</span>
              </div>
              {app.description && <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 12px" }}>{app.description}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{app.gatewayType}</span>
                <button style={S.btnSm("primary")} onClick={() => window.location.hash = `#app/${app.id}`}>Open →</button>
              </div>
            </div>
          ))}
          {apps.length === 0 && !showCreate && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
              <p>No apps yet. Create your first USSD app to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Menu Builder ─────────────────────────────────────────────────────────────
function MenuBuilder({ appId }) {
  const [menus, setMenus] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuName, setMenuName] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ itemType: "DISPLAY", label: "", inputPrompt: "", variableName: "", endMessage: "", webhookUrl: "", displayOrder: 0 });

  useEffect(() => { if (appId) loadMenus(); }, [appId]);

  async function loadMenus() {
    try { const m = await api.get(`/apps/${appId}/menus`); setMenus(m); if (!selected && m.length) setSelected(m[0]); } catch {}
  }

  async function addMenu() {
    try { await api.post(`/apps/${appId}/menus`, { name: menuName, root: menus.length === 0 }); setMenuName(""); setShowAddMenu(false); loadMenus(); } catch (e) { alert(e.message); }
  }

  async function addItem() {
    try { await api.post(`/apps/${appId}/menus/${selected.id}/items`, newItem); setAddingItem(false); setNewItem({ itemType: "DISPLAY", label: "", inputPrompt: "", variableName: "", endMessage: "", webhookUrl: "", displayOrder: 0 }); loadMenus(); } catch (e) { alert(e.message); }
  }

  async function deleteItem(itemId) {
    if (!confirm("Delete this item?")) return;
    try { await api.delete(`/apps/${appId}/menus/${selected.id}/items/${itemId}`); loadMenus(); } catch (e) { alert(e.message); }
  }

  const typeColor = { DISPLAY: "info", INPUT: "warning", WEBHOOK: "success", END: "danger", ROUTER: "default" };
  const ni = (k) => ({ value: newItem[k], onChange: (e) => setNewItem(p => ({ ...p, [k]: e.target.value })) });

  const currentMenu = menus.find(m => m.id === selected?.id);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Menu Builder</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Build your USSD menu flow visually</p>
        </div>
        <button style={S.btn()} onClick={() => setShowAddMenu(true)}>+ Add menu</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
        {/* Menu list */}
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 8 }}>Menus</p>
          {showAddMenu && (
            <div style={{ marginBottom: 12 }}>
              <input style={S.input} placeholder="Menu name" value={menuName} onChange={e => setMenuName(e.target.value)} />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button style={S.btnSm("primary")} onClick={addMenu}>Add</button>
                <button style={S.btnSm()} onClick={() => setShowAddMenu(false)}>×</button>
              </div>
            </div>
          )}
          {menus.map(m => (
            <div key={m.id} onClick={() => setSelected(m)}
              style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, background: selected?.id === m.id ? "var(--color-background-secondary)" : "transparent", fontWeight: selected?.id === m.id ? 500 : 400, display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              {m.root && <span title="Root menu" style={{ fontSize: 10 }}>★</span>}
              {m.name}
            </div>
          ))}
          {menus.length === 0 && <p style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>No menus yet</p>}
        </div>

        {/* Menu items */}
        <div style={S.card}>
          {!selected ? (
            <p style={{ color: "var(--color-text-secondary)", textAlign: "center", padding: "2rem" }}>Select a menu to edit its items</p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>{selected.name}</h3>
                  {selected.root && <span style={{ ...S.badge("info"), fontSize: 10 }}>Root menu</span>}
                </div>
                <button style={S.btnSm("primary")} onClick={() => setAddingItem(true)}>+ Add item</button>
              </div>

              {addingItem && (
                <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "1rem", marginBottom: 16 }}>
                  <p style={{ ...S.label, marginBottom: 12 }}>New menu item</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={S.label}>Type</label>
                      <select style={S.select} {...ni("itemType")}>
                        <option value="DISPLAY">Display (numbered option)</option>
                        <option value="INPUT">Input (free text)</option>
                        <option value="WEBHOOK">Webhook (call API)</option>
                        <option value="END">End (close session)</option>
                        <option value="ROUTER">Router (navigate)</option>
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Display order</label>
                      <input style={S.input} type="number" {...ni("displayOrder")} />
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={S.label}>Label (shown to user)</label>
                      <input style={S.input} {...ni("label")} placeholder="e.g. Check Balance" />
                    </div>
                    {newItem.itemType === "INPUT" && <>
                      <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Input prompt</label><input style={S.input} {...ni("inputPrompt")} /></div>
                      <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Save input as variable</label><input style={S.input} {...ni("variableName")} placeholder="e.g. phone_number" /></div>
                    </>}
                    {newItem.itemType === "END" && <div style={{ gridColumn: "1/-1" }}><label style={S.label}>End message</label><input style={S.input} {...ni("endMessage")} /></div>}
                    {newItem.itemType === "WEBHOOK" && <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Webhook URL</label><input style={S.input} {...ni("webhookUrl")} /></div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button style={S.btnSm("primary")} onClick={addItem}>Save item</button>
                    <button style={S.btnSm()} onClick={() => setAddingItem(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Items list */}
              {currentMenu?.items?.length === 0 && !addingItem && (
                <p style={{ color: "var(--color-text-secondary)", fontSize: 13, textAlign: "center", padding: "2rem" }}>No items yet. Add items to build your USSD flow.</p>
              )}
              {currentMenu?.items?.map((item, i) => (
                <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <div style={{ ...S.badge(typeColor[item.itemType] || "default"), flexShrink: 0, fontSize: 10, marginTop: 2 }}>{item.itemType}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{item.displayOrder}. {item.label}</p>
                    {item.inputPrompt && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>Prompt: {item.inputPrompt}</p>}
                    {item.variableName && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>→ saved as <code>{item.variableName}</code></p>}
                    {item.endMessage && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{item.endMessage}</p>}
                    {item.webhookUrl && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{item.webhookUrl}</p>}
                  </div>
                  <button style={{ ...S.btnSm(), color: "var(--color-text-danger)", borderColor: "transparent" }} onClick={() => deleteItem(item.id)}>✕</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* USSD Preview */}
      {currentMenu && currentMenu.items?.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
          <div style={{ ...S.card, flex: 1 }}>
            <p style={S.label}>USSD preview</p>
            <div style={{ background: "#1a1a1a", color: "#00ff41", borderRadius: 8, padding: "1rem", fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {currentMenu.items.map((item, i) => `${item.displayOrder || i + 1}. ${item.label}`).join("\n")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Webhook Info ─────────────────────────────────────────────────────────────
function WebhookPage({ appId }) {
  const webhookUrl = `http://YOUR_SERVER:8080/ussd/webhook/${appId}`;
  const [copied, setCopied] = useState(false);

  function copy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: 20, fontWeight: 500 }}>Integration</h2>
      <p style={{ margin: "0 0 1.5rem", fontSize: 13, color: "var(--color-text-secondary)" }}>Configure your telecom gateway to send requests to your webhook URL.</p>

      <div style={{ display: "grid", gap: 16 }}>
        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 8 }}>Your webhook URL</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code style={{ flex: 1, background: "var(--color-background-secondary)", padding: "10px 14px", borderRadius: 8, fontSize: 13, wordBreak: "break-all" }}>{webhookUrl}</code>
            <button style={S.btn()} onClick={() => copy(webhookUrl)}>{copied ? "✓ Copied" : "Copy"}</button>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 8 }}>Replace YOUR_SERVER with your actual server address or domain.</p>
        </div>

        {[
          { title: "Africa's Talking setup", steps: ["Log in to your AT dashboard", "Go to USSD → Create a channel", "Enter your short code (e.g. *714#)", "Set the callback URL to the webhook URL above", "Save and activate"] },
          { title: "Hubtel setup", steps: ["Log in to your Hubtel developer portal", "Create a new USSD application", "Under webhook/callback settings, paste the URL above", "Select 'JSON' as the request format", "Save your configuration"] },
        ].map(g => (
          <div key={g.title} style={S.card}>
            <p style={{ ...S.label, marginBottom: 12 }}>{g.title}</p>
            <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2, fontSize: 14 }}>
              {g.steps.map((s, i) => <li key={i} style={{ color: "var(--color-text-secondary)" }}>{s}</li>)}
            </ol>
          </div>
        ))}

        <div style={S.card}>
          <p style={{ ...S.label, marginBottom: 8 }}>HTTP method</p>
          <p style={{ fontSize: 14, margin: 0 }}>The webhook accepts <strong>POST</strong> requests. Africa's Talking sends form-encoded data; Hubtel sends JSON. Both are handled automatically.</p>
        </div>
      </div>
    </div>
  );
}

// ─── App Detail ───────────────────────────────────────────────────────────────
function AppDetail({ appId, onBack }) {
  const [tab, setTab] = useState("menus");
  const [app, setApp] = useState(null);

  useEffect(() => { api.get(`/apps/${appId}`).then(setApp).catch(() => {}); }, [appId]);

  const tabs = [
    { id: "menus", label: "Menu builder", icon: "ti-layout-list" },
    { id: "webhook", label: "Integration", icon: "ti-plug" },
    { id: "settings", label: "Settings", icon: "ti-settings" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <button style={{ ...S.btn(), padding: "6px 12px" }} onClick={onBack}>← Back</button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{app?.name || "Loading…"}</h2>
          {app && <span style={S.badge(app.status === "ACTIVE" ? "success" : "warning")}>{app.status}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.btn(), borderRadius: "8px 8px 0 0", borderBottom: tab === t.id ? "2px solid var(--color-text-primary)" : "2px solid transparent", borderLeft: "none", borderRight: "none", borderTop: "none", fontWeight: tab === t.id ? 500 : 400 }}>
            <i className={`ti ${t.icon}`} style={{ marginRight: 6, fontSize: 15 }} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "menus" && <MenuBuilder appId={appId} />}
      {tab === "webhook" && <WebhookPage appId={appId} />}
      {tab === "settings" && app && <AppSettings app={app} />}
    </div>
  );
}

function AppSettings({ app }) {
  const [form, setForm] = useState({ name: app.name, description: app.description || "", shortCode: app.shortCode || "", status: app.status });
  const [saved, setSaved] = useState(false);

  async function save() {
    try {
      await api.put(`/apps/${app.id}`, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert(e.message); }
  }

  const f = (k) => ({ value: form[k], onChange: (e) => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={S.label}>App name</label><input style={S.input} {...f("name")} /></div>
        <div><label style={S.label}>Description</label><input style={S.input} {...f("description")} /></div>
        <div><label style={S.label}>Short code</label><input style={S.input} {...f("shortCode")} /></div>
        <div>
          <label style={S.label}>Status</label>
          <select style={S.select} {...f("status")}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>
        <button style={S.btn("primary")} onClick={save}>{saved ? "✓ Saved" : "Save changes"}</button>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("apps");
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/auth/me").then(u => { setUser(u); setCheckingAuth(false); }).catch(() => { localStorage.removeItem("token"); setCheckingAuth(false); });
    } else {
      setCheckingAuth(false);
    }

    function onHash() {
      const hash = window.location.hash;
      if (hash.startsWith("#app/")) {
        setSelectedAppId(hash.replace("#app/", ""));
        setPage("app-detail");
      }
    }
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  if (checkingAuth) return <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}><p>Loading…</p></div>;
  if (!user) return <AuthPage onLogin={u => setUser(u)} />;

  const navItems = [
    { id: "apps", label: "My apps", icon: "ti-apps" },
    { id: "docs", label: "Documentation", icon: "ti-book" },
  ];

  return (
    <div style={S.app}>
      <div style={S.topbar}>
        <div style={S.logo}>
          <span style={{ fontSize: 20 }}>📡</span>
          <span>USSD Platform</span>
          <span style={{ ...S.badge("info"), marginLeft: 8 }}>{user.plan}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{user.tenantName}</span>
          <span style={{ fontSize: 13 }}>{user.fullName}</span>
          <button style={S.btnSm()} onClick={logout}>Sign out</button>
        </div>
      </div>

      <div style={S.layout}>
        <div style={S.sidebar}>
          {navItems.map(n => (
            <div key={n.id} style={S.navItem(page === n.id && !selectedAppId)} onClick={() => { setPage(n.id); setSelectedAppId(null); window.location.hash = ""; }}>
              <i className={`ti ${n.icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
              {n.label}
            </div>
          ))}
          <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", margin: "1rem 0", padding: "0.5rem 1.25rem" }}>
            <p style={{ ...S.label, marginBottom: 4 }}>Account</p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{user.email}</p>
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>{user.role}</p>
          </div>
        </div>

        <div style={S.main}>
          {page === "app-detail" && selectedAppId
            ? <AppDetail appId={selectedAppId} onBack={() => { setPage("apps"); setSelectedAppId(null); window.location.hash = ""; }} />
            : page === "apps" ? <AppsPage />
            : <div><h2 style={{ fontWeight: 500 }}>Documentation</h2><p style={{ color: "var(--color-text-secondary)" }}>Coming soon.</p></div>
          }
        </div>
      </div>
    </div>
  );
}
