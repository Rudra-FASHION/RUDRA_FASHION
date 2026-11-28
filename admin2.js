// Admin settings: delivery charge, Razorpay keys, orders. Loaded after admin.js.
(function () {
  const R = window.RF; if (!R) return;
  const { S, $, esc, inr, store } = R;
  const msg = (t, bad) => { const m = $("#cfMsg"); m.textContent = t || ""; m.hidden = !t; m.className = bad ? "err" : "status"; };
  const api = () => ($("#cfApi").value.trim().replace(/\/+$/, ""));
  async function readSettings() {
    const f = await R.getFile("settings.json");
    return { file: f, data: f ? JSON.parse(R.fromB64(f.content)) : {} };
  }
  async function saveSettings(patch) {
    for (let t = 0; t < 2; t++) {
      const { file, data } = await readSettings();
      const next = { ...data, ...patch };
      try { await R.putFile("settings.json", R.toB64(JSON.stringify(next, null, 2) + "\n"), "Update store settings", file && file.sha); return next; }
      catch (e) { if (t === 0 && (e.status === 409 || e.status === 422)) continue; throw e; }
    }
  }
  async function srv(path, method, body) {
    const r = await fetch(api() + path, { method: method || "GET", headers: { "content-type": "application/json", "x-admin-password": $("#cfPass").value }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Server se jawab nahi aaya.");
    return j;
  }
  async function showState() {
    if (!api() || !$("#cfPass").value) return;
    try { const s = await srv("/admin/state"); $("#cfState").textContent = s.keyId ? `Saved: ${s.keyId} ${/_live_/.test(s.keyId) ? "(LIVE, asli paisa)" : "(TEST, nakli paisa)"}${s.hasSecret ? ", secret saved" : ""}${s.hasWebhook ? ", webhook secret saved" : ""}` : "Abhi koi key saved nahi hai."; }
    catch (e) { $("#cfState").textContent = e.message; }
  }
  async function load() {
    try {
      const { data } = await readSettings();
      $("#cfCod").value = data.codFee > 0 ? data.codFee : ""; $("#cfFree").value = data.freeAbove >= 0 ? data.freeAbove : 699;
      $("#cfApi").value = data.api || ""; $("#cfPass").value = store.get("rudra-admin-pw") || "";
      showState();
    } catch (e) { msg("Settings nahi khuli. Internet check karo.", true); }
  }
  $("#cfg").addEventListener("toggle", () => { if ($("#cfg").open && S.token) load(); });
  $("#cfSaveDel").addEventListener("click", async () => {
    msg("Save ho raha hai...");
    try {
      await saveSettings({ codFee: Math.max(0, Math.round(+$("#cfCod").value || 0)), freeAbove: Math.max(0, Math.round(+$("#cfFree").value || 0)) });
      msg("Delivery save ho gaya. Store me 1-2 minute me dikhega.");
    } catch (e) { msg("Save nahi hua. Dobara try karo.", true); }
  });
  $("#cfSaveKeys").addEventListener("click", async () => {
    if (!/^https:\/\/[^\s]+$/.test(api())) return msg("Payment server ka link https:// se shuru hona chahiye.", true);
    if (!$("#cfPass").value) return msg("Admin password likho.", true);
    msg("Save ho raha hai...");
    try {
      const body = { keyId: $("#cfKey").value.trim(), keySecret: $("#cfSecret").value.trim(), webhookSecret: $("#cfWh").value.trim() };
      Object.keys(body).forEach(k => { if (!body[k]) delete body[k]; });
      await srv("/admin/keys", "POST", body);
      await saveSettings({ api: api() });
      store.set("rudra-admin-pw", $("#cfPass").value);
      $("#cfSecret").value = ""; $("#cfWh").value = "";
      msg("Razorpay save ho gaya. Ab store par Online payment chalu hai.");
      showState();
    } catch (e) { msg(e.message || "Save nahi hua.", true); }
  });
  const LABEL = { paid: "Paid ✓", created: "Payment pending", dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled" };
  async function orders() {
    const box = $("#ordList"); box.textContent = "Load ho raha hai...";
    try {
      const { orders } = await srv("/admin/orders");
      box.innerHTML = orders.length ? orders.map(o => `
        <div class="ord ${esc(o.status)}">
          <div><b>${esc(o.ref || o.id)}</b> · ${inr(o.subtotal)} · <span class="ost">${esc(LABEL[o.status] || o.status)}</span></div>
          <small>${esc(new Date(o.createdAt).toLocaleString("en-IN"))}</small>
          <div>${(o.lines || []).map(l => esc(l.name + " (" + l.size + ") x" + l.qty)).join("<br>")}</div>
          <div><b>${esc(o.cust.name)}</b> · <a href="https://wa.me/91${esc(o.cust.phone)}" target="_blank" rel="noopener">${esc(o.cust.phone)}</a><br>${esc(o.cust.addr)}</div>
          ${o.status === "paid" ? `<button class="mini" type="button" data-os="dispatched" data-oid="${esc(o.id)}">Dispatched mark karo</button>` : ""}
          ${o.status === "dispatched" ? `<button class="mini" type="button" data-os="delivered" data-oid="${esc(o.id)}">Delivered mark karo</button>` : ""}
        </div>`).join("") : "Abhi koi online order nahi aaya.";
    } catch (e) { box.textContent = e.message; }
  }
  $("#ordLoad").addEventListener("click", orders);
  $("#ordList").addEventListener("click", async e => {
    const b = e.target.closest("[data-os]"); if (!b) return;
    b.disabled = true;
    try { await srv("/admin/status", "POST", { id: b.dataset.oid, status: b.dataset.os }); orders(); } catch (x) { b.disabled = false; }
  });
})();
                              
