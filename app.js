const CONFIG = {
whatsapp: "919251073424",          // country code first, no + sign
upi: "BHARATPE2O0U0F9X3V74933@unitype",
upiAppButtons: true,               // merchant UPI ID is set, app buttons work
showQr: false,                     // true to also show a QR code at checkout
freeDeliveryAbove: 699,
shopName: "Rudra Fashion"
};
const FALLBACK = [];
let products = [];

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const okImg = u => typeof u === "string" && (/^images\/[A-Za-z0-9._-]+$/.test(u) || u.startsWith("https://"));
const imgs = p => (Array.isArray(p.images) && p.images.length ? p.images : (p.img ? [p.img] : [])).filter(okImg);
const inr = n => "₹" + Number(n).toLocaleString("en-IN");
const CAT_LABEL = { All: "All collection", Men: "Men's wear", Women: "Women's wear", Kids: "Kids' wear" };
const state = { cat: "All", q: "", sel: {}, cart: [] };
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const P = d => `<path class="g" d="${d}"/><path class="shade" d="${d}"/>`;
const L = d => `<path class="ln" d="${d}"/>`;
const SHAPES = {
tee: P("M70 30 L100 42 L130 30 L172 56 L156 92 L138 82 L138 218 L62 218 L62 82 L44 92 L28 56 Z") + L("M82 32 Q100 54 118 32"),
shirt: P("M68 32 L100 46 L132 32 L174 58 L166 168 L144 166 L140 92 L140 222 L60 222 L60 92 L56 166 L34 168 L26 58 Z") + L("M100 50 L100 222") + L("M82 33 L100 58 L118 33") + L("M110 90 L128 90 L128 108 L110 108 Z"),
kurti: P("M80 24 L100 36 L120 24 L132 84 L172 228 L28 228 L68 84 Z") + L("M82 26 Q100 52 118 26") + L("M68 84 Q100 98 132 84") + L("M100 52 L100 84"),
kurta: P("M75 28 L100 40 L125 28 L152 52 L142 84 L132 78 L132 156 L68 156 L68 78 L58 84 L48 52 Z") + P("M70 160 L130 160 L127 236 L106 236 L100 184 L94 236 L73 236 Z") + L("M82 30 Q100 56 118 30") + L("M100 56 L100 156"),
coord: P("M72 30 L100 42 L128 30 L152 54 L140 74 L130 68 L130 108 L70 108 L70 68 L60 74 L48 54 Z") + P("M66 114 L134 114 L150 236 L108 236 L100 146 L92 236 L50 236 Z") + L("M82 32 Q100 54 118 32"),
hoodie: P("M62 42 Q100 16 138 42 L178 74 L166 168 L146 164 L142 96 L140 218 L60 218 L58 96 L54 164 L34 168 L22 74 Z") + L("M70 44 Q100 80 130 44") + L("M92 72 L90 110") + L("M108 72 L110 110") + L("M74 170 L126 170 L130 200 L70 200 Z"),
cargo: P("M60 22 L140 22 L150 236 L108 236 L100 96 L92 236 L50 236 Z") + L("M60 40 L140 40") + L("M62 130 L82 130 L82 162 L58 162") + L("M138 130 L118 130 L118 162 L142 162"),
kurtiset: P("M76 26 L100 38 L124 26 L136 62 L132 124 L68 124 L64 62 Z") + P("M68 130 L132 130 L166 236 L108 236 L100 156 L92 236 L34 236 Z") + L("M80 28 Q100 52 120 28") + L("M100 52 L100 90")
};
const art = (type, tone) => `<svg class="garment" viewBox="0 0 200 250" style="--tone:${esc(tone || "#7f9480")}" aria-hidden="true">${SHAPES[type] || SHAPES.tee}</svg>`;
const photoOrArt = p => imgs(p).length ? `<img src="${esc(imgs(p)[0])}" alt="">` : art(p.type, p.tone);

try { const saved = JSON.parse(localStorage.getItem("rudra-cart-v2") || "[]"); if (Array.isArray(saved)) state.cart = saved.filter(i => i && i.id && i.size && i.qty > 0); } catch (e) {}
const saveCart = () => { try { localStorage.setItem("rudra-cart-v2", JSON.stringify(state.cart)); } catch (e) {} };

let toastTimer;
function toast(msg) {
const t = $("#toast");
t.textContent = msg; t.classList.add("show");
clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

function renderArches() {
const cats = ["Men", "Women", "Kids"].filter(c => products.some(p => p.category === c));
const el = $("#arches");
el.style.setProperty("--n", cats.length || 1);
el.innerHTML = cats.map(c => {
const list = products.filter(p => p.category === c);
const withPhoto = list.find(p => imgs(p).length);
const first = list[0], min = Math.min(...list.map(p => p.price));
const pic = withPhoto ? `<img class="ph" src="${esc(imgs(withPhoto)[0])}" alt="">` : art(first.type, first.tone);
return `<button class="arch${withPhoto ? " has-photo" : ""}" type="button" data-cat="${c}" aria-label="Shop ${CAT_LABEL[c]}">${pic}<span class="arch-label"><b>${c}</b><small>from ${inr(min)}</small></span></button>`;
}).join("");
}
function renderChips() {
$("#chips").innerHTML = Object.keys(CAT_LABEL).map(c => {
const n = c === "All" ? products.length : products.filter(p => p.category === c).length;
return `<button class="chip" type="button" data-cat="${c}" aria-pressed="${state.cat === c}">${CAT_LABEL[c]}<small>${n}</small></button>`;
}).join("");
}
function setCategory(c, scroll) {
state.cat = c; renderChips(); renderProducts();
if (scroll) $("#shop").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

function renderProducts() {
const words = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
const list = products.filter(p => {
if (state.cat !== "All" && p.category !== state.cat) return false;
const hay = (p.name + " " + p.desc + " " + p.category + " " + CAT_LABEL[p.category]).toLowerCase();
return words.every(w => hay.includes(w));
});
$("#productGrid").innerHTML = list.length ? list.map(p => {
const hasOff = p.mrp > p.price, off = hasOff ? Math.round((1 - p.price / p.mrp) * 100) : 0;
const im = imgs(p);
const slides = im.length ? `<div class="slides">${im.map((u, i) => `<button class="slide" type="button" data-zoom="${esc(p.id)}" data-i="${i}" aria-label="Photo ${i + 1} bade size me dekho"><img src="${esc(u)}" alt="${esc(p.name)} photo ${i + 1}"${i ? ' loading="lazy"' : ""}></button>`).join("")}</div>`
+ (im.length > 1 ? `<button class="nav prev" type="button" data-slide="-1" aria-label="Pichli photo">‹</button><button class="nav next" type="button" data-slide="1" aria-label="Agli photo">›</button><span class="dots" aria-hidden="true">${im.map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("")}</span>` : "") : art(p.type, p.tone);
const sizes = (p.sizes || []).map(s => `<button class="size" type="button" data-size="${esc(s)}" data-id="${esc(p.id)}" aria-pressed="${state.sel[p.id] === s}">${esc(s)}</button>`).join("");
return `<article class="card${p.soldOut ? " is-sold" : ""}">
<div class="art">${slides}${p.soldOut ? '<span class="sold">Sold out</span>' : hasOff ? `<span class="off">${off}% OFF</span>` : ""}<span class="tag">${esc(p.category)}</span></div>
<div class="body">
<h3 class="name">${esc(p.name)}</h3>
<p class="desc">${esc(p.desc)}</p>
<div class="sizes" role="group" aria-label="Size">${sizes}</div>
<div class="price"><b>${inr(p.price)}</b>${hasOff ? `<s>${inr(p.mrp)}</s>` : ""}<em>COD</em></div>
<button class="add" type="button" data-add="${esc(p.id)}"${p.soldOut ? " disabled" : ""}>${p.soldOut ? "Sold out" : "Add to bag"}</button>
</div>
</article>`;
}).join("") : `<div class="empty">${products.length ? "No outfits match your search. Try another word or clear the filter." : "New outfits are coming soon. Message us on WhatsApp to ask what is in stock."}</div>`;
}

const cartLines = () => state.cart.map(i => ({ ...i, p: products.find(p => p.id === i.id) })).filter(i => i.p);
const subtotal = () => cartLines().reduce((s, i) => s + i.p.price * i.qty, 0);
const shipFee = () => subtotal() >= CONFIG.freeDeliveryAbove ? 0 : cartLines().reduce((s, i) => s + (+i.p.ship || 0) * i.qty, 0);
const total = () => subtotal() + shipFee();

function renderCart() {
const lines = cartLines(), count = lines.reduce((s, i) => s + i.qty, 0), sub = subtotal();
$("#cartCount").textContent = count;
$("#cartItems").innerHTML = lines.length ? lines.map((i, idx) => `
<div class="line">
<div class="thumb">${photoOrArt(i.p)}</div>
<div><b>${esc(i.p.name)}</b><small>Size ${esc(i.size)} · ${inr(i.p.price)}</small>
<div class="qty"><button type="button" data-q="-1" data-i="${idx}" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button type="button" data-q="1" data-i="${idx}" aria-label="Increase quantity">+</button></div></div>
<button class="rm" type="button" data-rm="${idx}">Remove</button>
</div>`).join("") : `<div class="cart-empty">Your bag is empty.<br>Pick a size and tap Add to bag.</div>`;

const left = CONFIG.freeDeliveryAbove - sub;
const ship = $("#ship");
ship.style.setProperty("--p", Math.min(100, sub / CONFIG.freeDeliveryAbove * 100) + "%");
ship.innerHTML = sub === 0 ? `Free delivery on orders above ${inr(CONFIG.freeDeliveryAbove)}<i></i>`
: left > 0 ? `Add ${inr(left)} more for free delivery<i></i>` : `You have free delivery on this order<i></i>`;

$("#subTotal").textContent = inr(sub);
$("#delivery").textContent = shipFee() ? inr(shipFee()) : "Free";
$("#cartTotal").textContent = inr(total());
$("#orderBtn").disabled = lines.length === 0;
$("#done").hidden = true;
saveCart();
if (typeof refreshUpi === "function") refreshUpi();
}

function addToCart(id) {
const size = state.sel[id];
if (!size) { toast("Pick a size first"); return; }
const hit = state.cart.find(i => i.id === id && i.size === size);
hit ? hit.qty++ : state.cart.push({ id, size, qty: 1 });
renderCart(); toast("Added to your bag");
const b = $("#bagBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
}

function openCart() { $("#overlay").classList.add("open"); $("#drawer").classList.add("open"); $("#closeBtn").focus(); }
function closeCart() { $("#overlay").classList.remove("open"); $("#drawer").classList.remove("open"); $("#bagBtn").focus(); }

function openLb(id, i) {
const p = products.find(x => x.id === id); if (!p) return;
const im = imgs(p); if (!im.length) return;
$("#lbTrack").innerHTML = im.map((u, k) => `<div class="lb-slide"><img src="${esc(u)}" alt="${esc(p.name)} photo ${k + 1}"></div>`).join("");
$("#lb").hidden = false; document.body.style.overflow = "hidden";
$("#lb").classList.toggle("single", im.length < 2);
const tr = $("#lbTrack"); tr.scrollLeft = i * tr.clientWidth; lbCount();
$("#lbClose").focus();
}
function closeLb() { $("#lb").hidden = true; $("#lbTrack").innerHTML = ""; document.body.style.overflow = ""; }
function lbCount() {
const tr = $("#lbTrack"), n = tr.children.length;
$("#lbCount").textContent = n > 1 ? (Math.round(tr.scrollLeft / (tr.clientWidth || 1)) + 1) + " / " + n : "";
}
document.addEventListener("scroll", e => {
const t = e.target;
if (!(t instanceof Element)) return;
if (t.classList.contains("slides")) {
const i = Math.round(t.scrollLeft / (t.clientWidth || 1));
t.parentElement.querySelectorAll(".dots i").forEach((d, k) => d.classList.toggle("on", k === i));
} else if (t.id === "lbTrack") lbCount();
}, true);
$("#lbClose").addEventListener("click", closeLb);
$("#lbTrack").addEventListener("click", e => { if (e.target.tagName !== "IMG") closeLb(); });

const UA = navigator.userAgent, isAndroid = /android/i.test(UA), isIOS = /iphone|ipad|ipod/i.test(UA);
const UPI_APPS = {
phonepe: { pkg: "com.phonepe.app", ios: "phonepe://pay?" },
gpay: { pkg: "com.google.android.apps.nbu.paisa.user", ios: "gpay://upi/pay?" },
paytm: { pkg: "net.one97.paytm", ios: "paytmmp://pay?" },
any: null
};
if (!state.orderId) state.orderId = "RF" + Date.now().toString(36).slice(-5).toUpperCase();
function upiLink(key) {
const q = "pa=" + encodeURIComponent(CONFIG.upi) + "&pn=" + encodeURIComponent(CONFIG.shopName) + "&am=" + total() + "&cu=INR&tn=" + encodeURIComponent("Order " + state.orderId);
const app = UPI_APPS[key];
if (!app) return "upi://pay?" + q;
if (isAndroid) return "intent://pay?" + q + "#Intent;scheme=upi;package=" + app.pkg + ";end";
if (isIOS) return app.ios + q;
return "upi://pay?" + q;
}
function refreshUpi() {
document.querySelectorAll(".upay-app").forEach(a => { a.href = subtotal() > 0 ? upiLink(a.dataset.upi) : "#"; });
$("#orderIdText").textContent = state.orderId;
$(".upay-qr").hidden = !CONFIG.showQr;
$(".upay-apps").hidden = $("#upiAppsT").hidden = !CONFIG.upiAppButtons;
const sub = total(), box = $("#upiQr");
$("#upiAmt").textContent = sub > 0 ? "Pay karna hai: " + inr(sub) : "";
if (sub > 0) {
const payload = "upi://pay?pa=" + CONFIG.upi + "&pn=" + encodeURIComponent(CONFIG.shopName) + "&am=" + sub + "&cu=INR&tn=" + encodeURIComponent("Order " + state.orderId);
box.innerHTML = (typeof qrSvg === "function" && qrSvg(payload)) || "<span>QR nahi ban paya. Neeche UPI ID copy karo.</span>";
} else box.innerHTML = "<span>Pehle bag me kapda daalo, phir QR dikhega.</span>";
}
document.addEventListener("click", e => {
const a = e.target.closest(".upay-app"); if (!a) return;
if (!subtotal()) { e.preventDefault(); toast("Pehle bag me kapda daalo"); }
else if (!isAndroid && !isIOS) { e.preventDefault(); toast("Ye button phone par chalta hai. UPI ID copy karke app me daalo."); }
else state.payTried = true;
});
document.addEventListener("visibilitychange", () => {
if (document.visibilityState === "visible" && state.payTried) { state.payTried = false; $("#paidAsk").hidden = false; $("#paidAsk").scrollIntoView({ block: "center" }); }
});
$("#paidYes").addEventListener("click", () => { $("#paidAsk").hidden = true; sendOrder(); });
$("#paidNo").addEventListener("click", () => { $("#paidAsk").hidden = true; });

function fieldError(id, bad) { const f = $(id); f.classList.toggle("bad", bad); f.querySelector(".err").hidden = !bad; return bad; }

function sendOrder() {
const name = $("#custName").value.trim();
const phone = $("#custPhone").value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
const addr = $("#custAddress").value.trim();
const bad = [fieldError("#fName", name.length < 2), fieldError("#fPhone", !/^[6-9]\d{9}$/.test(phone)), fieldError("#fAddr", addr.length < 10)];
if (bad.some(Boolean)) { document.querySelector(".field.bad input")?.focus(); return; }

const pay = $("#payMode").value === "UPI" ? "UPI (screenshot to follow)" : "Cash on delivery";
const ref = state.orderId;
const rows = cartLines().map((i, n) => `${n + 1}. ${i.p.name} | Size ${i.size} | Qty ${i.qty} | ${inr(i.p.price * i.qty)}`).join("\n");
const msg = `*New order - Rudra Fashion*\nOrder ID: ${ref}\n\n${rows}\n\nItems: ${inr(subtotal())}\nDelivery: ${shipFee() ? inr(shipFee()) : "Free"}\n*Total: ${inr(total())}*\nPayment: ${pay}\n\nName: ${name}\nPhone: ${phone}\nAddress: ${addr}`;
const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
$("#waLink").href = url; $("#done").hidden = false;
window.open(url, "_blank");
}


document.addEventListener("click", e => {
const t = e.target.closest("button, a");
if (!t) return;
if (t.dataset.slide) { const el = t.parentElement.querySelector(".slides"); if (el) el.scrollBy({ left: +t.dataset.slide * el.clientWidth, behavior: reduceMotion ? "auto" : "smooth" }); }
else if (t.dataset.zoom) openLb(t.dataset.zoom, +t.dataset.i || 0);
else if (t.dataset.lb) { const el = $("#lbTrack"); el.scrollBy({ left: +t.dataset.lb * el.clientWidth, behavior: reduceMotion ? "auto" : "smooth" }); }
else if (t.dataset.cat) setCategory(t.dataset.cat, t.classList.contains("arch"));
else if (t.dataset.nav) setCategory(t.dataset.nav, true);
else if (t.dataset.size) {
state.sel[t.dataset.id] = t.dataset.size;
t.parentElement.querySelectorAll(".size").forEach(b => b.setAttribute("aria-pressed", b === t));
}
else if (t.dataset.add) addToCart(t.dataset.add);
else if (t.dataset.q) {
const item = state.cart[+t.dataset.i]; item.qty += +t.dataset.q;
if (item.qty < 1) state.cart.splice(+t.dataset.i, 1);
renderCart();
}
else if (t.dataset.rm) { state.cart.splice(+t.dataset.rm, 1); renderCart(); }
});
$("#shopNow").addEventListener("click", e => { e.preventDefault(); $("#shop").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); });
$("#searchInput").addEventListener("input", e => { state.q = e.target.value; renderProducts(); });
$("#bagBtn").addEventListener("click", openCart);
$("#closeBtn").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
document.addEventListener("keydown", e => {
if (!$("#lb").hidden) {
if (e.key === "Escape") closeLb();
else if (e.key === "ArrowRight") $("#lbTrack").scrollBy({ left: $("#lbTrack").clientWidth, behavior: "smooth" });
else if (e.key === "ArrowLeft") $("#lbTrack").scrollBy({ left: -$("#lbTrack").clientWidth, behavior: "smooth" });
return;
}
if (e.key === "Escape" && $("#drawer").classList.contains("open")) closeCart();
});
$("#payMode").addEventListener("change", e => { $("#upiBox").hidden = e.target.value !== "UPI"; });
$("#orderBtn").addEventListener("click", sendOrder);
$("#copyUpi").addEventListener("click", () => {
const done = () => toast("UPI ID copied");
const fail = () => { const r = document.createRange(); r.selectNodeContents($("#upiText")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Press and hold to copy"); };
navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(CONFIG.upi).then(done, fail) : fail();
});

const waBase = `https://wa.me/${CONFIG.whatsapp}`;
$("#heroWa").href = waBase + "?text=" + encodeURIComponent("Hi Rudra Fashion, I need help choosing an outfit.");
$("#footWa").href = waBase;
$("#upiText").textContent = CONFIG.upi;
renderChips(); renderCart();
$("#productGrid").innerHTML = '<div class="empty">Collection load ho raha hai...</div>';

async function loadProducts() {
try {
const r = await fetch("products.json?v=" + Date.now(), { cache: "no-store" });
if (!r.ok) throw new Error("HTTP " + r.status);
const d = await r.json();
products = Array.isArray(d.products) ? d.products : [];
} catch (e) {
products = FALLBACK;
}
renderArches(); renderChips(); renderProducts(); renderCart();
}
loadProducts();
                                                                                      
