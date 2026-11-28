// Online payment through Razorpay. Runs only when a payment server is set in the admin.
let paying = false;
function afterCart() {
  const online = $("#payMode").value === "ONLINE", btn = $("#orderBtn");
  if (!btn) return;
  btn.textContent = online ? "Pay " + inr(total()) + " securely" : "Confirm order on WhatsApp";
  btn.disabled = cartLines().length === 0 || paying;
  const m = $("#paidMsg"); if (m && cartLines().length) m.hidden = true;
}
document.addEventListener("rf-settings", () => {
  if (!CONFIG.api) return;
  const u = [...$("#payMode").options].find(o => o.value === "UPI");
  if (u) { u.value = "ONLINE"; u.textContent = "Online payment (UPI, card, netbanking)"; }
  $("#upiBox").hidden = true;
  renderCart();
});
const loadRzp = () => window.Razorpay ? Promise.resolve() : new Promise((ok, no) => {
  const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js";
  s.onload = ok; s.onerror = () => no(new Error("Payment page load nahi hua. Internet check karo.")); document.head.appendChild(s);
});
const post = async (path, body) => {
  const r = await fetch(CONFIG.api + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Kuch gadbad hui. Dobara try karo.");
  return j;
};
function showPaid(ref, rows, name, phone, addr, tot, verified) {
  let m = $("#paidMsg");
  if (!m) { m = document.createElement("div"); m.id = "paidMsg"; m.className = "done"; $("#done").before(m); }
  const wa = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(`*Paid order - Rudra Fashion*\nOrder ID: ${ref}\n\n${rows}\n\n*Paid online: ${inr(tot)}*\n\nName: ${name}\nPhone: ${phone}\nAddress: ${addr}`);
  m.innerHTML = verified
    ? `<b>Payment mil gaya. Order confirmed ✓</b><br>Order ID: <b>${ref}</b>. Hum jaldi dispatch karenge.<br><a href="${wa}" target="_blank" rel="noopener">Order ki jaankari WhatsApp par bhi bhejo</a>`
    : `<b>Payment hua hai to chinta mat karo.</b> Order ID <b>${ref}</b> note kar lo. Confirmation me thoda time lag sakta hai.<br><a href="${wa}" target="_blank" rel="noopener">WhatsApp par Order ID bhejo</a>`;
  m.hidden = false; m.scrollIntoView({ block: "center" });
}
async function payOnline() {
  const c = cust(); if (!c || paying) return;
  paying = true; afterCart(); $("#orderBtn").textContent = "Please wait...";
  const lines = cartLines(), ref = state.orderId, tot = total();
  const rows = lines.map((i, n) => `${n + 1}. ${i.p.name} | Size ${i.size} | Qty ${i.qty} | ${inr(i.p.price * i.qty)}`).join("\n");
  try {
    const o = await post("/order", { items: lines.map(i => ({ id: i.id, size: i.size, qty: i.qty })), cust: c, ref });
    await loadRzp();
    const rz = new Razorpay({
      key: o.key, order_id: o.orderId, amount: o.amount, currency: "INR", name: CONFIG.shopName, description: "Order " + ref,
      prefill: { name: c.name, contact: c.phone }, theme: { color: "#c9a25f" },
      handler: async resp => {
        let ok = false;
        try { ok = (await post("/verify", resp)).ok; } catch (e) {}
        state.cart = []; state.orderId = "RF" + Date.now().toString(36).slice(-5).toUpperCase(); paying = false;
        renderCart(); showPaid(ref, rows, c.name, c.phone, c.addr, tot, ok);
      },
      modal: { ondismiss: () => { paying = false; afterCart(); } }
    });
    rz.on("payment.failed", () => toast("Payment nahi hua. Dobara try karo."));
    rz.open();
  } catch (e) { toast(e.message); paying = false; afterCart(); }
}
document.addEventListener("click", e => {
  if (e.target.closest("#orderBtn") && $("#payMode").value === "ONLINE") { e.stopImmediatePropagation(); e.preventDefault(); payOnline(); }
}, true);
