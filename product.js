// Product page: photos, price, size, details, Add to bag and Buy now. Loaded after app.js (uses its globals).
(function () {
  const css = document.createElement("style");
  css.textContent = `
.card .name,.card .desc{cursor:pointer}
.pp{position:fixed;inset:0;z-index:80;background:var(--bg);color:var(--fg);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.pp[hidden]{display:none}
.pp-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(10px + env(safe-area-inset-top,0px)) max(14px,env(safe-area-inset-right,0px)) 10px max(14px,env(safe-area-inset-left,0px));background:var(--bg);border-bottom:1px solid var(--line)}
.pp-top b{font-family:var(--display);font-size:20px;letter-spacing:.04em}
.pp-top button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font-weight:700;font-size:13px}
.pp-top button span{display:inline-block;min-width:18px;margin-left:4px;padding:0 5px;border-radius:9px;background:var(--brass);color:var(--brass-ink);font-size:11px;line-height:18px;text-align:center}
.pp-wrap{display:grid;gap:18px;max-width:1000px;margin:0 auto;padding:14px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px))}
.pp-gal{min-width:0}
.pp-main{position:relative;border-radius:14px;overflow:hidden;background:var(--surface)}
.pp-slides{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.pp-slides::-webkit-scrollbar{display:none}
.pp-slide{flex:0 0 100%;aspect-ratio:4/5;max-height:58vh;scroll-snap-align:center;scroll-snap-stop:always;border:0;padding:0;background:var(--surface);display:grid;place-items:center}
.pp-slide img{width:100%;height:100%;max-width:none;object-fit:cover;display:block}
.pp-slide .garment{width:62%}
.pp-off{position:absolute;top:12px;left:12px;background:var(--brass);color:var(--brass-ink);font-size:12px;font-weight:800;padding:4px 10px;border-radius:7px}
.pp-cnt{position:absolute;right:12px;bottom:12px;background:rgba(0,0,0,.55);color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px}
.pp-thumbs{display:flex;gap:8px;margin-top:10px;overflow-x:auto;scrollbar-width:none}
.pp-thumbs button{flex:0 0 auto;width:56px;height:70px;padding:0;border-radius:9px;overflow:hidden;border:2px solid transparent;background:var(--surface);opacity:.65}
.pp-thumbs button.on{border-color:var(--brass);opacity:1}
.pp-thumbs img{width:100%;height:100%;object-fit:cover;display:block}
.pp-info{display:grid;gap:14px;align-content:start;min-width:0}
.pp-cat{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--brass)}
.pp-name{font-size:24px;line-height:1.25;font-weight:700;overflow-wrap:anywhere}
.pp-price{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 12px}
.pp-price b{font-size:30px;font-weight:800;font-variant-numeric:tabular-nums}
.pp-price s{color:var(--muted);font-size:16px}
.pp-price em{font-style:normal;font-size:12px;font-weight:800;background:var(--fg);color:var(--bg);padding:3px 9px;border-radius:6px}
.pp-lab{font-size:13px;font-weight:700;display:flex;justify-content:space-between;gap:10px}
.pp-lab small{color:var(--muted);font-weight:600}
.pp-sizes{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;padding:4px;border-radius:12px;border:1px solid transparent}
.pp-sizes.need{border-color:var(--danger);animation:ppshake .35s}
@keyframes ppshake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.pp-sizes button{min-width:50px;height:44px;padding:0 14px;border-radius:10px;border:1px solid var(--line);background:transparent;font-weight:700;font-size:14px;color:var(--muted)}
.pp-sizes button[aria-pressed="true"]{background:var(--fg);border-color:var(--fg);color:var(--bg)}
.pp h2{font-size:15px;font-weight:800;letter-spacing:.02em;margin-bottom:6px}
.pp-desc{color:var(--muted);font-size:14.5px;line-height:1.65;white-space:pre-line;overflow-wrap:anywhere}
.pp-list{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:8px;font-size:13.5px;color:var(--muted)}
.pp-list li{display:flex;gap:9px;line-height:1.5}
.pp-list li::before{content:"✓";color:var(--brass);font-weight:800}
.pp-list a{color:var(--brass);font-weight:700}
.pp-bar{position:sticky;bottom:0;z-index:3;background:var(--bg);border-top:1px solid var(--line);padding:10px max(16px,env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.pp-bar div{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:1000px;margin:0 auto}
.pp-bar button{min-height:50px;border-radius:12px;font-weight:800;font-size:14.5px;border:2px solid var(--brass)}
.pp-bar .pp-add{background:transparent;color:var(--brass)}
.pp-bar .pp-buy{background:var(--brass);color:var(--brass-ink)}
.pp-bar button:disabled{border-color:var(--line);background:var(--surface-2);color:var(--muted);cursor:not-allowed}
@media(min-width:820px){.pp-slide{max-height:none}.pp-wrap{grid-template-columns:1fr 1fr;gap:34px;padding-top:24px}.pp-gal{position:sticky;top:76px;align-self:start}.pp-name{font-size:30px}}`;
  document.head.appendChild(css);

  const pg = document.createElement("section");
  pg.className = "pp"; pg.hidden = true; pg.setAttribute("role", "dialog"); pg.setAttribute("aria-modal", "true"); pg.setAttribute("aria-label", "Product details");
  document.body.appendChild(pg);
  let cur = null, pushed = false, opener = null;

  const slidesEl = () => pg.querySelector(".pp-slides");
  function render(p) {
    const im = imgs(p), hasOff = p.mrp > p.price, off = hasOff ? Math.round((1 - p.price / p.mrp) * 100) : 0, id = esc(p.id);
    const slides = im.length ? im.map((u, i) => `<button class="pp-slide" type="button" data-pp="zoom" data-i="${i}" aria-label="Photo ${i + 1} bade size me dekho"><img src="${esc(u)}" alt="${esc(p.name)} photo ${i + 1}"${i ? ' loading="lazy"' : ""}></button>`).join("") : `<div class="pp-slide">${art(p.type, p.tone)}</div>`;
    const thumbs = im.length > 1 ? `<div class="pp-thumbs">${im.map((u, i) => `<button type="button" data-pp="thumb" data-i="${i}"${i ? "" : ' class="on"'} aria-label="Photo ${i + 1}"><img src="${esc(u)}" alt=""></button>`).join("")}</div>` : "";
    const sizes = (p.sizes || []).map(s => `<button type="button" data-pp="size" data-s="${esc(s)}" aria-pressed="${state.sel[p.id] === s}">${esc(s)}</button>`).join("");
    const adv = CONFIG.codAdvance > 0 ? ` Pehle ${inr(CONFIG.codAdvance)} advance online dena hoga, baaki delivery par.` : "";
    const fee = CONFIG.codFee > 0 ? ` Delivery charge ${inr(CONFIG.codFee)}, ${inr(CONFIG.freeDeliveryAbove)} se upar free.` : "";
    pg.innerHTML = `
<div class="pp-top"><button type="button" data-pp="close">‹ Wapas</button><b>${esc(CONFIG.shopName)}</b><button type="button" data-pp="bag">Bag<span id="ppCount">${esc($("#cartCount").textContent)}</span></button></div>
<div class="pp-wrap">
<div class="pp-gal"><div class="pp-main"><div class="pp-slides">${slides}</div>${p.soldOut ? "" : hasOff ? `<span class="pp-off">${off}% OFF</span>` : ""}${im.length > 1 ? `<span class="pp-cnt" id="ppCnt">1 / ${im.length}</span>` : ""}</div>${thumbs}</div>
<div class="pp-info">
<div class="pp-cat">${esc(CAT_LABEL[p.category] || p.category)}</div>
<h1 class="pp-name">${esc(p.name)}</h1>
<div class="pp-price"><b>${inr(p.price)}</b>${hasOff ? `<s>${inr(p.mrp)}</s><em>${off}% OFF</em>` : ""}</div>
<div><div class="pp-lab"><span>Size chuno</span><small id="ppPick">${state.sel[p.id] ? "Chuna hua: " + esc(state.sel[p.id]) : ""}</small></div><div class="pp-sizes" id="ppSizes" role="group" aria-label="Size">${sizes}</div></div>
<div><h2>Product details</h2><p class="pp-desc">${esc(p.desc)}</p>
<ul class="pp-list">
<li>Size available: ${esc((p.sizes || []).join(", "))}</li>
<li>Online payment (UPI, card) par delivery free</li>
<li>Cash on delivery available.${esc(adv + fee)}</li>
<li><span>7 din me return ya exchange (kharab ya galat product par). <a href="policies.html#returns" target="_blank" rel="noopener">Policy padho</a></span></li>
</ul></div>
</div></div>
<div class="pp-bar"><div><button class="pp-add" type="button" data-pp="add"${p.soldOut ? " disabled" : ""}>${p.soldOut ? "Sold out" : "Add to bag"}</button><button class="pp-buy" type="button" data-pp="buy"${p.soldOut ? " disabled" : ""}>Buy now</button></div></div>`;
  }

  function open(id, i) {
    const p = products.find(x => x.id === id); if (!p) return;
    cur = p; opener = document.activeElement; render(p);
    pg.hidden = false; pg.scrollTop = 0; document.body.style.overflow = "hidden";
    const s = slidesEl(); if (s && i) s.scrollLeft = i * s.clientWidth;
    if (!pushed) { try { history.pushState({ pp: 1 }, ""); pushed = true; } catch (e) {} }
    pg.querySelector('[data-pp="close"]').focus();
  }
  function hide() {
    if (pg.hidden) return;
    pg.hidden = true; document.body.style.overflow = ""; cur = null;
    renderProducts();
    if (opener && opener.isConnected) { try { opener.focus(); } catch (e) {} }
  }
  function close() { hide(); if (pushed) { pushed = false; try { history.back(); } catch (e) {} } }
  window.addEventListener("popstate", () => { if (!pg.hidden) { pushed = false; hide(); } });

  function needSize() {
    if (state.sel[cur.id]) return false;
    const z = $("#ppSizes"); toast("Pehle size chuno");
    z.classList.remove("need"); void z.offsetWidth; z.classList.add("need"); z.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    return true;
  }
  pg.addEventListener("click", e => {
    const b = e.target.closest("[data-pp]"); if (!b || !cur) return;
    const a = b.dataset.pp;
    if (a === "close") close();
    else if (a === "bag") openCart();
    else if (a === "zoom") openLb(cur.id, +b.dataset.i || 0);
    else if (a === "thumb") { const s = slidesEl(); s.scrollTo({ left: +b.dataset.i * s.clientWidth, behavior: reduceMotion ? "auto" : "smooth" }); }
    else if (a === "size") {
      state.sel[cur.id] = b.dataset.s; $("#ppPick").textContent = "Chuna hua: " + b.dataset.s;
      $("#ppSizes").classList.remove("need");
      pg.querySelectorAll('[data-pp="size"]').forEach(x => x.setAttribute("aria-pressed", x === b));
    }
    else if (a === "add") { if (!needSize()) addToCart(cur.id); }
    else if (a === "buy") {
      if (needSize()) return;
      const id = cur.id, size = state.sel[id];
      if (!state.cart.some(i => i.id === id && i.size === size)) addToCart(id);
      close(); openCart();
    }
  });
  pg.addEventListener("scroll", e => {
    const t = e.target; if (!t.classList || !t.classList.contains("pp-slides")) return;
    const i = Math.round(t.scrollLeft / (t.clientWidth || 1)), n = t.children.length, c = $("#ppCnt");
    if (c) c.textContent = (i + 1) + " / " + n;
    pg.querySelectorAll(".pp-thumbs button").forEach((x, k) => x.classList.toggle("on", k === i));
  }, true);

  // Tapping a photo, name or description on a card opens this page.
  document.addEventListener("click", e => {
    if (pg.contains(e.target)) return;
    const z = e.target.closest("[data-zoom]");
    if (z) { e.stopImmediatePropagation(); e.preventDefault(); open(z.dataset.zoom, +z.dataset.i || 0); return; }
    const n = e.target.closest(".card .name, .card .desc");
    if (n) { const a = n.closest(".card").querySelector("[data-add]"); if (a) open(a.dataset.add, 0); }
  }, true);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !pg.hidden && $("#lb").hidden && !$("#drawer").classList.contains("open")) close();
  });
  new MutationObserver(() => { const c = $("#ppCount"); if (c) c.textContent = $("#cartCount").textContent; }).observe($("#cartCount"), { childList: true, characterData: true, subtree: true });
})();
    
