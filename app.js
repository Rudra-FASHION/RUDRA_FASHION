  // ---- Settings: change these ----
  const CONFIG = {
    whatsapp: "919251073424",          // country code first, no + sign
    upi: "BHARATPE2O0U0F9X3V74933@unitype",
    upiAppButtons: true,               // merchant UPI ID is set, app buttons work
    showQr: false,                     // true to also show a QR code at checkout
    freeDeliveryAbove: 699,
    shopName: "Rudra Fashion"
  };
  // Products come from products.json (edited by the admin app).
  const FALLBACK = [];
  let products = [];

  // ---- Helpers ----
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okImg = u => typeof u === "string" && (/^images\/[A-Za-z0-9._-]+$/.test(u) || u.startsWith("https://"));
  const imgs = p => (Array.isArray(p.images) && p.images.length ? p.images : (p.img ? [p.img] : [])).filter(okImg);
  const inr = n => "₹" + Number(n).toLocaleString("en-IN");
  const CAT_LABEL = { All: "All collection", Men: "Men's wear", Women: "Women's wear", Kids: "Kids' wear" };
  const state = { cat: "All", q: "", sel: {}, cart: [] };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Garment illustrations (shown when a product has no photo) ----
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

  // ---- Arches and chips ----
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

  // ---- Products ----
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

  // ---- Cart ----
  const cartLines = () => state.cart.map(i => ({ ...i, p: products.find(p => p.id === i.id) })).filter(i => i.p);
  const subtotal = () => cartLines().reduce((s, i) => s + i.p.price * i.qty, 0);

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
    $("#delivery").textContent = sub >= CONFIG.freeDeliveryAbove ? "Free" : "Confirmed on WhatsApp";
    $("#cartTotal").textContent = inr(sub);
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

  // ---- Photo gallery (fullscreen) ----
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

  // ---- Tiny QR code maker (byte mode, level M, up to version 6) ----
  function qrMatrix(text, forceMask) {
    const bytes = Array.from(new TextEncoder().encode(text));
    const DC = [16, 28, 44, 64, 86, 108], EC = [10, 16, 26, 18, 24, 16], NB = [1, 1, 1, 2, 2, 4];
    let v = 0; while (v < 6 && bytes.length + 2 > DC[v]) v++;
    if (v === 6) return null;
    const ver = v + 1, size = 17 + 4 * ver, dc = DC[v], ecl = EC[v], nb = NB[v];
    // data bits
    const bits = [];
    const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, 8); bytes.forEach(b => put(b, 8));
    for (let i = 0; i < 4 && bits.length < dc * 8; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const cw = []; for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(""), 2));
    for (let p = 0xEC; cw.length < dc; p ^= 0xEC ^ 0x11) cw.push(p);
    // Reed-Solomon
    const exp = new Array(512), log = new Array(256); let x = 1;
    for (let i = 0; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; }
    for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
    const mul = (a, b) => (a && b) ? exp[log[a] + log[b]] : 0;
    let gen = [1];
    for (let i = 0; i < ecl; i++) { const n = new Array(gen.length + 1).fill(0); gen.forEach((c, j) => { n[j] ^= c; n[j + 1] ^= mul(c, exp[i]); }); gen = n; }
    const rs = data => { const r = new Array(ecl).fill(0); data.forEach(d => { const f = d ^ r.shift(); r.push(0); gen.slice(1).forEach((g, i) => { r[i] ^= mul(g, f); }); }); return r; };
    const shortLen = Math.floor(dc / nb), longCount = dc % nb, blocks = [];
    for (let i = 0, k = 0; i < nb; i++) { const len = shortLen + (i >= nb - longCount ? 1 : 0); const d = cw.slice(k, k + len); k += len; blocks.push({ d, e: rs(d) }); }
    const all = [];
    for (let i = 0; i <= shortLen; i++) blocks.forEach(b => { if (i < b.d.length) all.push(b.d[i]); });
    for (let i = 0; i < ecl; i++) blocks.forEach(b => all.push(b.e[i]));
    // function patterns
    const M = Array.from({ length: size }, () => new Array(size).fill(false));
    const F = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (cx, cy, dark) => { if (cx >= 0 && cy >= 0 && cx < size && cy < size) { M[cy][cx] = dark; F[cy][cx] = true; } };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4); }
    });
    if (ver >= 2) { const c = size - 7; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
    const fmt = mask => {
      let rem = mask; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const b = ((mask << 10) | rem) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
      set(8, size - 8, true);
    };
    fmt(0);
    // place data
    let n = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const cx = right - j, up = ((right + 1) & 2) === 0, cy = up ? size - 1 - vert : vert;
        if (!F[cy][cx] && n < all.length * 8) { M[cy][cx] = ((all[n >>> 3] >>> (7 - (n & 7))) & 1) === 1; n++; }
      }
    }
    const MASKS = [(i, j) => (i + j) % 2 === 0, (i, j) => j % 2 === 0, (i, j) => i % 3 === 0, (i, j) => (i + j) % 3 === 0,
      (i, j) => (Math.floor(i / 3) + Math.floor(j / 2)) % 2 === 0, (i, j) => (i * j) % 2 + (i * j) % 3 === 0,
      (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0, (i, j) => ((i + j) % 2 + (i * j) % 3) % 2 === 0];
    const base = M.map(r => r.slice());
    const apply = m => { for (let y = 0; y < size; y++) for (let cx = 0; cx < size; cx++) M[y][cx] = base[y][cx] !== (!F[y][cx] && MASKS[m](cx, y)); fmt(m); };
    const penalty = () => {
      let p = 0, dark = 0;
      const lines = [];
      for (let y = 0; y < size; y++) { lines.push(M[y].map(b => b ? "1" : "0").join("")); }
      for (let cx = 0; cx < size; cx++) { lines.push(M.map(r => r[cx] ? "1" : "0").join("")); }
      lines.forEach(s => {
        const r = s.match(/0{5,}|1{5,}/g); if (r) r.forEach(t => { p += 3 + t.length - 5; });
        for (let i = 0; i + 11 <= s.length; i++) { const w = s.substr(i, 11); if (w === "10111010000" || w === "00001011101") p += 40; }
      });
      for (let y = 0; y < size - 1; y++) for (let cx = 0; cx < size - 1; cx++) { const c = M[y][cx]; if (c === M[y][cx + 1] && c === M[y + 1][cx] && c === M[y + 1][cx + 1]) p += 3; }
      M.forEach(r => r.forEach(b => { if (b) dark++; }));
      return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    };
    let best = 0, bestP = Infinity;
    if (forceMask === undefined) { for (let m = 0; m < 8; m++) { apply(m); const p = penalty(); if (p < bestP) { bestP = p; best = m; } } } else best = forceMask;
    apply(best);
    return { size, modules: M };
  }
  function qrSvg(text) {
    const q = qrMatrix(text); if (!q) return "";
    let d = ""; q.modules.forEach((row, y) => row.forEach((b, x) => { if (b) d += "M" + (x + 4) + " " + (y + 4) + "h1v1h-1z"; }));
    const s = q.size + 8;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges" role="img" aria-label="UPI QR code"><rect width="${s}" height="${s}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  // ---- UPI app buttons ----
  const UA = navigator.userAgent, isAndroid = /android/i.test(UA), isIOS = /iphone|ipad|ipod/i.test(UA);
  const UPI_APPS = {
    phonepe: { pkg: "com.phonepe.app", ios: "phonepe://pay?" },
    gpay: { pkg: "com.google.android.apps.nbu.paisa.user", ios: "gpay://upi/pay?" },
    paytm: { pkg: "net.one97.paytm", ios: "paytmmp://pay?" },
    any: null
  };
  if (!state.orderId) state.orderId = "RF" + Date.now().toString(36).slice(-5).toUpperCase();
  function upiLink(key) {
    const q = "pa=" + encodeURIComponent(CONFIG.upi) + "&pn=" + encodeURIComponent(CONFIG.shopName) + "&am=" + subtotal() + "&cu=INR&tn=" + encodeURIComponent("Order " + state.orderId);
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
    const sub = subtotal(), box = $("#upiQr");
    $("#upiAmt").textContent = sub > 0 ? "Pay karna hai: " + inr(sub) : "";
    if (sub > 0) {
      const payload = "upi://pay?pa=" + CONFIG.upi + "&pn=" + encodeURIComponent(CONFIG.shopName) + "&am=" + sub + "&cu=INR&tn=" + encodeURIComponent("Order " + state.orderId);
      box.innerHTML = qrSvg(payload) || "<span>QR nahi ban paya. Neeche UPI ID copy karo.</span>";
    } else box.innerHTML = "<span>Pehle bag me kapda daalo, phir QR dikhega.</span>";
  }
  document.addEventListener("click", e => {
    const a = e.target.closest(".upay-app"); if (!a) return;
    if (!subtotal()) { e.preventDefault(); toast("Pehle bag me kapda daalo"); }
    else if (!isAndroid && !isIOS) { e.preventDefault(); toast("Ye button phone par chalta hai. UPI ID copy karke app me daalo."); }
    else state.payTried = true;
  });
  // When the customer comes back from the UPI app, ask if payment is done
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.payTried) { state.payTried = false; $("#paidAsk").hidden = false; $("#paidAsk").scrollIntoView({ block: "center" }); }
  });
  $("#paidYes").addEventListener("click", () => { $("#paidAsk").hidden = true; sendOrder(); });
  $("#paidNo").addEventListener("click", () => { $("#paidAsk").hidden 
