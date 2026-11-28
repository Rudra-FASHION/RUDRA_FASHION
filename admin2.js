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
      showState(); if (api() && $("#cfPass").value) orders();
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
  const st = document.createElement("style");
  st.textContent = ".ord .ln{display:flex;gap:10px;align-items:center}.ord .ln img{width:56px;height:70px;object-fit:cover;border-radius:8px;flex:none;background:#26211c}.ord .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:800;font-size:13px;background:#1f8a4c;color:#fff}.ord .badge.created{background:#b7791f}.ord .badge.cancelled{background:#b23b29}.ord .addr{background:rgba(127,127,127,.15);border-radius:8px;padding:8px}.ord a.mini{display:inline-flex;align-items:center;justify-content:center;text-decoration:none}";
  document.head.appendChild(st);
  const pimg = n => { const p = S.products.find(x => x.name === n), u = p && ((p.images && p.images[0]) || p.img) || ""; return /^images\/[A-Za-z0-9._-]+$/.test(u) ? u : ""; };
  const thanks = o => `Namaste ${o.cust.name}, aapka order (Order ID: ${o.ref || o.id}) hume mil gaya hai. Hum jaldi aap tak pahuchayenge. Rudra Fashion ki website se shopping karne ke liye dhanyawad! 7 din ke andar aapka order aap tak pahunch jayega, kripya order lene ke liye taiyar rahein.`;
  async function orders() {
    const box = $("#ordList"); box.textContent = "Load ho raha hai...";
    try {
      const { orders } = await srv("/admin/orders");
      box.innerHTML = orders.length ? orders.map(o => {
        const ph = String(o.cust.phone).replace(/\D/g, ""), paid = ["paid", "dispatched", "delivered"].includes(o.status);
        return `
        <div class="ord ${esc(o.status)}">
          <div><span class="badge ${esc(o.status)}">${esc(LABEL[o.status] || o.status)}</span> <b>${inr(o.subtotal)}</b> · Order ${esc(o.ref || o.id)}</div>
          <small>${esc(new Date(o.createdAt).toLocaleString("en-IN"))}${o.paymentId ? " · Payment ID: " + esc(o.paymentId) : ""}</small>
          ${(o.lines || []).map(l => { const s = pimg(l.name); return `<div class="ln">${s ? `<img src="${esc(s)}" alt="">` : ""}<div><b>${esc(l.name)}</b><br>Size: <b>${esc(l.size)}</b> · Qty ${esc(l.qty)} · ${inr(l.price * l.qty)}</div></div>`; }).join("")}
          <div class="addr"><b>${esc(o.cust.name)}</b> · <a href="tel:+91${esc(ph)}">${esc(ph)}</a><br>${esc(o.cust.addr)}</div>
          ${paid ? `<a class="mini" href="https://wa.me/91${esc(ph)}?text=${encodeURIComponent(thanks(o))}" target="_blank" rel="noopener">Customer ko WhatsApp par dhanyawad bhejo</a>` : ""}
          ${o.status === "paid" ? `<button class="mini" type="button" data-os="dispatched" data-oid="${esc(o.id)}">Dispatched mark karo</button>` : ""}
          ${o.status === "dispatched" ? `<button class="mini" type="button" data-os="delivered" data-oid="${esc(o.id)}">Delivered mark karo</button>` : ""}
        </div>`; }).join("") : "Abhi koi online order nahi aaya.";
    } catch (e) { box.textContent = e.message; }
  }
  $("#ordLoad").addEventListener("click", orders);
  $("#ordList").addEventListener("click", async e => {
    const b = e.target.closest("[data-os]"); if (!b) return;
    b.disabled = true;
    try { await srv("/admin/status", "POST", { id: b.dataset.oid, status: b.dataset.os }); orders(); } catch (x) { b.disabled = false; }
  });
})();
