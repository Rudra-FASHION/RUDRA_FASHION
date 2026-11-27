  // ---- Settings: change these ----
  const CONFIG = {
    whatsapp: "919251073424",          // country code first, no + sign
    upi: "vihanthakur021x@ptyes",
    freeDeliveryAbove: 699
  };
  // Products come from products.json (edited by the admin app).
  const FALLBACK = [];
  let products = [];

  // ---- Helpers ----
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okImg = u => typeof u === "string" && (/^images\/[A-Za-z0-9._-]+$/.test(u) || u.startsWith("https://"));
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
  const photoOrArt = p => okImg(p.img) ? `<img src="${esc(p.img)}" alt="">` : art(p.type, p.tone);

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
      const withPhoto = list.find(p => okImg(p.img));
      const first = list[0], min = Math.min(...list.map(p => p.price));
      const pic = withPhoto ? `<img class="ph" src="${esc(withPhoto.img)}" alt="">` : art(first.type, first.tone);
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
      const img = okImg(p.img) ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">` : "";
      const sizes = (p.sizes || []).map(s => `<button class="size" type="button" data-size="${esc(s)}" data-id="${esc(p.id)}" aria-pressed="${state.sel[p.id] === s}">${esc(s)}</button>`).join("");
      return `<article class="card${p.soldOut ? " is-sold" : ""}">
        <div class="art">${art(p.type, p.tone)}${img}${p.soldOut ? '<span class="sold">Sold out</span>' : hasOff ? `<span class="off">${off}% OFF</span>` : ""}<span class="tag">${esc(p.category)}</span></div>
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

  // ---- Order on WhatsApp ----
  function fieldError(id, bad) { const f = $(id); f.classList.toggle("bad", bad); f.querySelector(".err").hidden = !bad; return bad; }

  function sendOrder() {
    const name = $("#custName").value.trim();
    const phone = $("#custPhone").value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
    const addr = $("#custAddress").value.trim();
    const bad = [fieldError("#fName", name.length < 2), fieldError("#fPhone", !/^[6-9]\d{9}$/.test(phone)), fieldError("#fAddr", addr.length < 10)];
    if (bad.some(Boolean)) { document.querySelector(".field.bad input")?.focus(); return; }

    const pay = $("#payMode").value === "UPI" ? "UPI (screenshot to follow)" : "Cash on delivery";
    const rows = cartLines().map((i, n) => `${n + 1}. ${i.p.name} | Size ${i.size} | Qty ${i.qty} | ${inr(i.p.price * i.qty)}`).join("\n");
    const msg = `*New order - Rudra Fashion*\n\n${rows}\n\n*Total: ${inr(subtotal())}*\nPayment: ${pay}\n\nName: ${name}\nPhone: ${phone}\nAddress: ${addr}`;
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
    $("#waLink").href = url; $("#done").hidden = false;
    window.open(url, "_blank");
  }


  // ---- Events ----
  document.addEventListener("click", e => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.dataset.cat) setCategory(t.dataset.cat, t.classList.contains("arch"));
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
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#drawer").classList.contains("open")) closeCart(); });
  $("#payMode").addEventListener("change", e => { $("#upiBox").hidden = e.target.value !== "UPI"; });
  $("#orderBtn").addEventListener("click", sendOrder);
  $("#copyUpi").addEventListener("click", () => {
    const done = () => toast("UPI ID copied");
    const fail = () => { const r = document.createRange(); r.selectNodeContents($("#upiText")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Press and hold to copy"); };
    navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(CONFIG.upi).then(done, fail) : fail();
  });

  // ---- Start ----
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
