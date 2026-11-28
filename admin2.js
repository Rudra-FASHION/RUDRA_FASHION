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
    try { const s = await srv("/admin/state"); $("#cfState").textContent = s.keyId ? `Saved: ${s.keyId} ${/_live_/.test(s.keyId) ? "(LIVE, asli paisa)" : "(TEST, nakli paisa)"}${s.hasSecret ? ", secret saved" : ""}${s.hasWebhook ? ", webhook secret saved" : " | DHYAN DO: webhook secret save nahi hai, kabhi kabhi paid order 'Payment pending' dikh sakta hai. Neeche 'Razorpay se check karo' dabao ya webhook jodo."}` : "Abhi koi key saved nahi hai."; }
    catch (e) { $("#cfState").textContent = e.message; }
  }
  async function load() {
    try {
      const { data } = await readSettings();
      $("#cfCod").value = data.codFee > 0 ? data.codFee : ""; $("#cfFree").value = data.freeAbove >= 0 ? data.freeAbove : 699; $("#cfAdv").value = data.codAdvance > 0 ? data.codAdvance : "";
      $("#cfApi").value = data.api || ""; $("#cfPass").value = store.get("rudra-admin-pw") || "";
      showState(); if (api() && $("#cfPass").value) orders();
    } catch (e) { msg("Settings nahi khuli. Internet check karo.", true); }
  }
  $("#cfSaveDel").insertAdjacentHTML("beforebegin", '<div class="field"><label for="cfAdv">COD advance (₹) har COD order par, 0 = advance nahi</label><input id="cfAdv" type="number" inputmode="numeric" min="0" placeholder="20"></div><p class="hint">Ye advance kapde ke daam me nahi katta, alag hota hai. Customer Razorpay se pehle deta hai, tabhi COD order confirm hota hai. Kapde ke paise delivery par.</p>');
  $("#cfg").addEventListener("toggle", () => { if ($("#cfg").open && S.token) load(); });
  $("#cfSaveDel").addEventListener("click", async () => {
    msg("Save ho raha hai...");
    try {
      const adv = Math.max(0, Math.round(+$("#cfAdv").value || 0));
      if (adv > 5000) return msg("Advance 5000 se zyada nahi ho sakta.", true);
      const s = await saveSettings({ codFee: Math.max(0, Math.round(+$("#cfCod").value || 0)), freeAbove: Math.max(0, Math.round(+$("#cfFree").value || 0)), codAdvance: adv });
      msg(adv > 0 && !s.api ? "Save ho gaya, par advance tabhi chalega jab neeche Razorpay save ho." : "Save ho gaya. Store me 1-2 minute me dikhega.");
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
  st.textContent = "[hidden]{display:none!important}.ord .ln{display:flex;gap:10px;align-items:center}.ord .ln img{width:56px;height:70px;object-fit:cover;border-radius:8px;flex:none;background:#26211c}.ord .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:800;font-size:13px;background:#1f8a4c;color:#fff}.ord .badge.created{background:#b7791f}.ord .badge.cancelled{background:#b23b29}.ord .addr{background:rgba(127,127,127,.15);border-radius:8px;padding:8px}.ord a.mini{display:inline-flex;align-items:center;justify-content:center;text-decoration:none}";
  document.head.appendChild(st);
  const pimg = n => { const p = S.products.find(x => x.name === n), u = p && ((p.images && p.images[0]) || p.img) || ""; return /^images\/[A-Za-z0-9._-]+$/.test(u) ? u : ""; };
  const thanks = o => `Namaste ${o.cust.name}, aapka order (Order ID: ${o.ref || o.id}) hume mil gaya hai. Hum jaldi aap tak pahuchayenge.${o.type === "cod" ? " Delivery par " + inr(o.due) + " dena hoga." : ""} Rudra Fashion ki website se shopping karne ke liye dhanyawad! 7 din ke andar aapka order aap tak pahunch jayega, kripya order lene ke liye taiyar rahein.`;
  let nextCur = "";
  async function orders(more) {
    const box = $("#ordList"); if (!more) box.textContent = "Load ho raha hai...";
    try {
      const { orders, cursor } = await srv("/admin/orders" + (more && nextCur ? "?cursor=" + encodeURIComponent(nextCur) : ""));
      nextCur = cursor || ""; $("#ordMore").hidden = !nextCur;
      const html = orders.length ? orders.map(o => {
        const ph = String(o.cust.phone).replace(/\D/g, ""), paid = ["paid", "dispatched", "delivered"].includes(o.status), cod = o.type === "cod";
        return `
        <div class="ord ${esc(o.status)}">
          <div><span class="badge ${esc(o.status)}">${esc((cod ? "COD · " : "") + (cod && o.status === "paid" ? "Advance " + inr(o.advance) + " mila ✓" : LABEL[o.status] || o.status))}</span> <b>${inr(o.subtotal)}</b> · Order ${esc(o.ref || o.id)}</div>
          ${cod ? `<div class="addr"><b>Delivery par lena hai: ${inr(o.due)}</b><br><small>Kapde ${inr(o.subtotal)}${o.due > o.subtotal ? " + delivery " + inr(o.due - o.subtotal) : ""}. Advance ${inr(o.advance)} alag mil chuka (isme nahi jodna).</small></div>` : ""}
          <small>${esc(new Date(o.createdAt).toLocaleString("en-IN"))}${o.paymentId ? " · Payment ID: " + esc(o.paymentId) : ""}</small>
          ${(o.lines || []).map(l => { const s = pimg(l.name); return `<div class="ln">${s ? `<img src="${esc(s)}" alt="">` : ""}<div><b>${esc(l.name)}</b><br>Size: <b>${esc(l.size)}</b> · Qty ${esc(l.qty)} · ${inr(l.price * l.qty)}</div></div>`; }).join("")}
          <div class="addr"><b>${esc(o.cust.name)}</b> · <a href="tel:+91${esc(ph)}">${esc(ph)}</a><br>${esc(o.cust.addr)}</div>
          ${paid ? `<a class="mini" href="https://wa.me/91${esc(ph)}?text=${encodeURIComponent(thanks(o))}" target="_blank" rel="noopener">Customer ko WhatsApp par dhanyawad bhejo</a>` : ""}
          ${o.status === "paid" ? `<button class="mini" type="button" data-os="dispatched" data-oid="${esc(o.id)}">Dispatched mark karo</button>` : ""}
          ${o.status === "dispatched" ? `<button class="mini" type="button" data-os="delivered" data-oid="${esc(o.id)}">Delivered mark karo</button>` : ""}
          ${["created", "cancelled", "delivered"].includes(o.status) ? `<button class="mini" type="button" data-del="1" data-oid="${esc(o.id)}">Ye order list se hatao</button>` : ""}
        </div>`; }).join("") : "Abhi koi online order nahi aaya.";
      if (more) box.insertAdjacentHTML("beforeend", html); else box.innerHTML = html;
    } catch (e) { if (!more) box.textContent = e.message; else toast(e.message); }
  }
  const toast = t => msg(t, true);
  $("#ordLoad").addEventListener("click", () => orders());
  $("#ordMore").addEventListener("click", () => orders(true));
  $("#ordSync").addEventListener("click", async () => {
    const b = $("#ordSync"); b.disabled = true; b.textContent = "Check ho raha hai...";
    try { const r = await srv("/admin/sync", "POST", {}); msg(r.fixed ? r.fixed + " order Paid mark ho gaye (payment mil chuka tha)." : "Sab theek hai, koi order chhoota nahi."); await orders(); }
    catch (e) { msg(e.message, true); }
    b.disabled = false; b.textContent = "Razorpay se check karo";
  });
  $("#ordList").addEventListener("click", async e => {
    const d = e.target.closest("[data-del]");
    if (d) {
      if (!confirm("Is order ko list se hamesha ke liye hatana hai?")) return;
      d.disabled = true;
      try { await srv("/admin/delete", "POST", { id: d.dataset.oid }); d.closest(".ord").remove(); msg("Order hata diya."); } catch (x) { d.disabled = false; msg(x.message, true); orders(); }
      return;
    }
    const b = e.target.closest("[data-os]"); if (!b) return;
    b.disabled = true;
    try { await srv("/admin/status", "POST", { id: b.dataset.oid, status: b.dataset.os }); orders(); } catch (x) { b.disabled = false; msg(x.message, true); }
  });
})();
            
