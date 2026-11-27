  window.addEventListener("error", function (e) { var b = document.getElementById("errBar"); if (!b) { b = document.createElement("div"); b.id = "errBar"; document.body.appendChild(b); } b.textContent = "Error: " + e.message + " (line " + e.lineno + ")"; });
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = n => "₹" + Number(n).toLocaleString("en-IN");
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const SIZE_SETS = { Men: ["S", "M", "L", "XL", "XXL"], Women: ["S", "M", "L", "XL", "XXL"], Kids: ["2-4Y", "4-6Y", "6-8Y", "8-10Y", "10-12Y"] };
  const DEFAULT_LOOK = { Men: ["tee", "#d8d0c0"], Women: ["kurti", "#8c2f45"], Kids: ["hoodie", "#b5533a"] };

  const S = { token: "", repo: "", branch: "main", products: [], thumbs: {}, cur: null, isNew: false, busy: false, delTimer: 0, delArm: null };

  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }

  // ---------- GitHub ----------
  async function gh(path, opt) {
    opt = opt || {};
    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + S.token };
    if (opt.body) headers["Content-Type"] = "application/json";
    const r = await fetch("https://api.github.com/repos/" + S.repo + path, { method: opt.method || "GET", headers, body: opt.body, cache: "no-store" });
    let data = null; try { data = await r.json(); } catch (e) {}
    if (!r.ok) { const err = new Error((data && data.message) || "HTTP " + r.status); err.status = r.status; throw err; }
    return data;
  }
  const toB64 = str => { const bytes = new TextEncoder().encode(str); let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const fromB64 = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, "")), c => c.charCodeAt(0)));

  async function getFile(path) {
    try { return await gh("/contents/" + path + "?ref=" + encodeURIComponent(S.branch)); }
    catch (e) { if (e.status === 404) return null; throw e; }
  }
  const putFile = (path, b64, message, sha) => gh("/contents/" + path, { method: "PUT", body: JSON.stringify({ message, content: b64, branch: S.branch, ...(sha ? { sha } : {}) }) });
  async function tryDeleteFile(path) {
    try {
      const f = await getFile(path); if (!f) return;
      await gh("/contents/" + path, { method: "DELETE", body: JSON.stringify({ message: "Remove old photo", sha: f.sha, branch: S.branch }) });
    } catch (e) {}
  }
  function parseList(file) {
    if (!file) return [];
    const d = JSON.parse(fromB64(file.content));
    return Array.isArray(d.products) ? d.products : [];
  }
  // Always edits the newest products.json so nothing is overwritten by an old copy.
  async function commit(mutator, message) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const file = await getFile("products.json");
      const next = mutator(parseList(file));
      const body = JSON.stringify({ products: next, updated: new Date().toISOString() }, null, 2) + "\n";
      try {
        await putFile("products.json", toB64(body), message, file && file.sha);
        S.products = next; return;
      } catch (e) { if (attempt === 0 && (e.status === 409 || e.status === 422)) continue; throw e; }
    }
  }
  function explain(e) {
    const s = e && e.status;
    if (s === 401) return "Token galat hai ya expire ho gaya. Disconnect karke naya token daalo.";
    if (s === 403) return "Is token ko likhne ki permission nahi hai. Token me Contents ko Read and write karo.";
    if (s === 404) return "Repo nahi mila. Repo ka naam check karo aur token me ye repo chuna hona chahiye.";
    if (s === 409 || s === 422) return "Store kahin aur se badla hai. Dobara Save karo.";
    if (!s) return "Internet check karo aur dobara try karo.";
    return "GitHub ne kaha: " + e.message;
  }

  // ---------- Screens ----------
  function show(which) {
    $("#setup").hidden = which !== "setup";
    $("#home").hidden = which !== "home";
    $("#editor").hidden = which !== "editor";
    $("#disc").hidden = which === "setup";
    window.scrollTo(0, 0);
  }
  const MAXP = 6;
  const allImgs = p => Array.isArray(p.images) && p.images.length ? p.images : (p.img ? [p.img] : []);
  const srcOf = u => S.thumbs[u] || (u && /^(images\/[A-Za-z0-9._-]+|https:\/\/.+)$/.test(u) ? u : "");
  const imgSrc = p => srcOf(allImgs(p)[0]);

  function renderList() {
    $("#count").textContent = S.products.length ? S.products.length + " kapde store me" : "";
    $("#list").innerHTML = S.products.length ? S.products.map(p => {
      const src = imgSrc(p);
      return `<div class="prow">
        <div class="pthumb">${src ? `<img src="${esc(src)}" alt="">` : "Photo nahi"}</div>
        <div class="pinfo"><b>${esc(p.name)}</b><small>${esc(p.category)} · ${allImgs(p).length} photo · ${inr(p.price)}${p.mrp > p.price ? " (MRP " + inr(p.mrp) + ")" : ""}${p.soldOut ? ' · <span class="tagsold">Sold out</span>' : ""}</small></div>
        <div class="pbtns">
          <button class="mini" type="button" data-edit="${esc(p.id)}">Badlo</button>
          <button class="mini${S.delArm === p.id ? " armed" : ""}" type="button" data-del="${esc(p.id)}">${S.delArm === p.id ? "Pakka hatana hai?" : "Hatao"}</button>
        </div>
      </div>`;
    }).join("") : '<div class="emptylist">Abhi koi kapda nahi hai.<br>Upar "Naya kapda jodo" dabao.</div>';
  }
  function showHome(notice) {
    S.cur = null; S.delArm = null;
    const n = $("#notice");
    n.hidden = !notice;
    if (notice) $("#noticeText").textContent = notice;
    renderList(); show("home");
  }

  function setBusy(on, msg) {
    S.busy = on;
    document.querySelectorAll("#editor button, #home button").forEach(b => { b.disabled = on; });
    const st = $("#status"); st.hidden = !on; if (on) st.textContent = msg || "";
    $("#pfSave").textContent = on ? "Ruko..." : "Save karo";
  }
  function setStatus(msg) { $("#status").textContent = msg; }

  // ---------- Editor ----------
  function openEdit(p) {
    S.isNew = !p;
    const base = p || { id: "p" + Date.now().toString(36), name: "", category: "Men", price: "", mrp: "", desc: "", sizes: [], type: "", tone: "", img: "", soldOut: false };
    S.cur = { ...base, sizes: [...(base.sizes || [])], photos: allImgs(base).filter(u => srcOf(u)).map(u => ({ path: u, src: srcOf(u) })) };
    $("#pfName").value = base.name; $("#pfPrice").value = base.price; $("#pfMrp").value = base.mrp || "";
    $("#pfDesc").value = base.desc || ""; $("#pfSold").checked = !!base.soldOut; $("#pfCustom").value = "";
    $("#pfErr").hidden = true; $("#status").hidden = true;
    $("#pfDelete").hidden = !p; $("#pfDelete").classList.remove("armed"); $("#pfDelete").textContent = "Ye kapda hata do";
    $("#editTitle").textContent = p ? "Kapda badlo" : "Naya kapda";
    renderCat(); renderSizes(); renderPhoto(); renderDisc(); show("editor");
  }
  function renderCat() { document.querySelectorAll("#pfCat button").forEach(b => b.setAttribute("aria-pressed", b.dataset.pcat === S.cur.category)); }
  function renderSizes() {
    const all = [...new Set([...SIZE_SETS[S.cur.category], ...S.cur.sizes])];
    $("#pfSizes").innerHTML = all.map(s => `<button class="size" type="button" data-psize="${esc(s)}" aria-pressed="${S.cur.sizes.includes(s)}">${esc(s)}</button>`).join("");
  }
  function renderPhoto() {
    const ph = S.cur.photos;
    $("#pgrid").innerHTML = ph.map((p, i) => `<div class="pcell"><img src="${esc(p.src)}" alt="Photo ${i + 1}">${i === 0 ? '<span class="pfirst">Pehli</span>' : `<button class="pmk" type="button" data-pfirst="${i}">Pehli banao</button>`}<button class="pdel" type="button" data-pdel="${i}" aria-label="Photo hatao">×</button></div>`).join("")
      + (ph.length < MAXP ? '<label class="padd" for="pfPhoto"><b>+</b><span>Photo jodo</span></label>' : "");
    $("#pcount").textContent = ph.length + " / " + MAXP + " photo" + (ph.length < 4 ? ". Kam se kam 4 lagao, tabhi customer ko pasand aata hai." : ".");
  }
  function renderDisc() {
    const price = Number($("#pfPrice").value), mrp = Number($("#pfMrp").value);
    $("#discHint").textContent = mrp > price && price > 0 ? `Customers ko ${Math.round((1 - price / mrp) * 100)}% OFF dikhega.` : "Discount tab dikhega jab MRP price se zyada ho.";
  }
  async function fileToJpeg(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const W = 720, H = 900, c = document.createElement("canvas"); c.width = W; c.height = H;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
      x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      return c.toDataURL("image/jpeg", 0.82);
    } finally { URL.revokeObjectURL(url); }
  }

  async function save() {
    if (S.busy) return;
    const name = $("#pfName").value.trim();
    const price = Math.round(Number($("#pfPrice").value));
    const mrp = Math.round(Number($("#pfMrp").value)) || 0;
    const fail = m => { const e = $("#pfErr"); e.textContent = m; e.hidden = false; e.scrollIntoView({ block: "center" }); };
    $("#pfErr").hidden = true;
    if (name.length < 2) return fail("Kapde ka naam likho.");
    if (!(price > 0)) return fail("Bechne ka price likho.");
    if (!S.cur.sizes.length) return fail("Kam se kam ek size chuno.");

    const old = S.products.find(x => x.id === S.cur.id);
    const oldImgs = old ? allImgs(old) : [];
    const look = DEFAULT_LOOK[S.cur.category];
    const order = [...new Set([...SIZE_SETS[S.cur.category], ...S.cur.sizes])];
    const item = {
      id: S.cur.id, name, category: S.cur.category, price, mrp,
      desc: $("#pfDesc").value.trim(), sizes: order.filter(s => S.cur.sizes.includes(s)),
      type: S.cur.type || look[0], tone: S.cur.tone || look[1], images: [], img: "", soldOut: $("#pfSold").checked
    };

    setBusy(true, "Save ho raha hai...");
    try {
      const paths = [], stamp = Date.now().toString(36), total = S.cur.photos.filter(p => p.data && !p.path).length;
      let n = 0;
      for (const [i, ph] of S.cur.photos.entries()) {
        if (ph.path) { paths.push(ph.path); continue; }
        setStatus("Photo " + (++n) + " / " + total + " upload ho rahi hai...");
        const path = `images/${S.cur.id}-${stamp}${i}.jpg`;
        await putFile(path, ph.data.split(",")[1], "Add photo: " + name);
        S.thumbs[path] = ph.data; ph.path = path; paths.push(path);
      }
      item.images = paths; item.img = paths[0] || "";
      setStatus("Store update ho raha hai...");
      await commit(list => S.isNew ? [item, ...list] : list.map(x => x.id === item.id ? item : x), (S.isNew ? "Add " : "Update ") + name);
      const gone = oldImgs.filter(u => u.startsWith("images/") && !paths.includes(u));
      background(async () => {
        for (const u of gone) await tryDeleteFile(u);
        if (S.isNew && paths.length) await makeOg();
      });
      setBusy(false);
      showHome("Save ho gaya. Website par 1 se 2 minute me dikhega.");
    } catch (e) {
      setBusy(false);
      fail(explain(e));
    }
  }

  async function removeProduct(id) {
    if (S.busy) return;
    const old = S.products.find(x => x.id === id);
    S.busy = true; document.querySelectorAll("#home button").forEach(b => b.disabled = true);
    try {
      await commit(list => list.filter(x => x.id !== id), "Remove " + (old ? old.name : id));
      if (old) background(async () => { for (const u of allImgs(old)) if (u.startsWith("images/")) await tryDeleteFile(u); });
      S.busy = false; document.querySelectorAll("#home button").forEach(b => b.disabled = false);
      showHome("Hata diya. Website par 1 se 2 minute me badlav dikhega.");
    } catch (e) {
      S.busy = false; document.querySelectorAll("#home button").forEach(b => b.disabled = false);
      S.delArm = null; renderList(); toast(explain(e));
    }
  }

  // ---------- Background work, icons and share preview ----------
  let bgChain = Promise.resolve();
  const background = fn => { bgChain = bgChain.then(fn).catch(() => {}); };
  async function putGenerated(path, b64, msg) { const f = await getFile(path); await putFile(path, b64, msg, f && f.sha); }
  async function makeOg() {
    const srcs = S.products.filter(p => allImgs(p).length).slice(0, 3).map(p => srcOf(allImgs(p)[0])).filter(Boolean);
    await putGenerated("og.jpg", await drawOg(srcs), "Update share preview");
  }
  async function ensureAssets() {
    const made = [];
    for (const [path, size] of [["icons/icon-192.png", 192], ["icons/icon-512.png", 512]]) {
      if (!(await getFile(path))) { await putFile(path, await drawIcon(size), "Add app icon"); made.push(path); }
    }
    if (!(await getFile("og.jpg"))) { await makeOg(); made.push("og.jpg"); }
    return made;
  }
  function afterConnect() {
    background(async () => {
      const made = await ensureAssets();
      if (made.length) { $("#notice").hidden = false; $("#noticeText").textContent = "App icon aur WhatsApp preview ban gaye. 2 minute baad admin dobara kholo, phir Chrome menu me Install app dikhega."; }
    });
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

  // ---------- Connect ----------
  function guessRepo() {
    const h = location.hostname, p = location.pathname.split("/").filter(Boolean);
    if (!h.endsWith(".github.io")) return "";
    const owner = h.split(".")[0];
    return p.length > 1 ? owner + "/" + p[0] : owner + "/" + h;
  }
  async function connect(repo, token) {
    S.repo = repo; S.token = token;
    const info = await gh("");
    if (info.permissions && info.permissions.push === false) { const e = new Error("no push"); e.status = 403; throw e; }
    S.branch = info.default_branch || "main";
    S.products = parseList(await getFile("products.json"));
    store.set("rudra-admin-repo", repo); store.set("rudra-admin-token", token);
  }

  // ---------- Events ----------
  $("#setupForm").addEventListener("submit", async e => {
    e.preventDefault();
    const repo = $("#repoIn").value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/+$/, "");
    const token = $("#tokenIn").value.trim();
    const err = $("#setupErr"); err.hidden = true;
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { err.textContent = "Repo aise likho: naam/repo"; err.hidden = false; return; }
    if (token.length < 20) { err.textContent = "Token paste karo."; err.hidden = false; return; }
    const b = $("#connectBtn"); b.disabled = true; b.textContent = "Connect ho raha hai...";
    try { await connect(repo, token); $("#tokenIn").value = ""; showHome(""); afterConnect(); }
    catch (ex) { err.textContent = explain(ex); err.hidden = false; }
    b.disabled = false; b.textContent = "Connect karo";
  });
  $("#disc").addEventListener("click", () => {
    store.del("rudra-admin-token"); S.token = ""; S.products = [];
    $("#setupErr").hidden = true; show("setup");
  });
  $("#addNew").addEventListener("click", () => openEdit(null));
  $("#regenOg").addEventListener("click", async () => {
    if (S.busy) return;
    const b = $("#regenOg"); b.disabled = true; toast("Preview ban raha hai...");
    try { await makeOg(); toast("Preview update ho gaya. WhatsApp me naya dikhne me thoda time lagta hai."); }
    catch (e) { toast(explain(e)); }
    b.disabled = false;
  });
  $("#pfCancel").addEventListener("click", () => { if (!S.busy) showHome(""); });
  $("#editor").addEventListener("submit", e => { e.preventDefault(); save(); });
  $("#pfPrice").addEventListener("input", renderDisc);
  $("#pfMrp").addEventListener("input", renderDisc);

  document.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t || S.busy) return;
    if (t.dataset.edit) openEdit(S.products.find(p => p.id === t.dataset.edit));
    else if (t.dataset.del) {
      if (S.delArm === t.dataset.del) { removeProduct(t.dataset.del); return; }
      S.delArm = t.dataset.del; clearTimeout(S.delTimer);
      S.delTimer = setTimeout(() => { S.delArm = null; renderList(); }, 4000); renderList();
    }
    else if (t.dataset.pcat) {
      if ((t.dataset.pcat === "Kids") !== (S.cur.category === "Kids")) S.cur.sizes = [];
      S.cur.category = t.dataset.pcat; renderCat(); renderSizes();
    }
    else if (t.dataset.pdel) { S.cur.photos.splice(+t.dataset.pdel, 1); renderPhoto(); }
    else if (t.dataset.pfirst) { const x = S.cur.photos.splice(+t.dataset.pfirst, 1)[0]; S.cur.photos.unshift(x); renderPhoto(); }
    else if (t.dataset.psize) {
      const s = t.dataset.psize, i = S.cur.sizes.indexOf(s);
      i >= 0 ? S.cur.sizes.splice(i, 1) : S.cur.sizes.push(s); renderSizes();
    }
  });
  $("#pfAddSize").addEventListener("click", () => {
    const s = $("#pfCustom").value.trim(); if (!s) return;
    if (!S.cur.sizes.includes(s)) S.cur.sizes.push(s);
    $("#pfCustom").value = ""; renderSizes();
  });
  $("#pfCustom").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("#pfAddSize").click(); } });
  $("#pfPhoto").addEventListener("change", async e => {
    const files = Array.from(e.target.files || []); e.target.value = "";
    if (!files.length) return;
    const room = MAXP - S.cur.photos.length;
    if (files.length > room) toast("Sirf " + MAXP + " photo ho sakti hain");
    for (const f of files.slice(0, room)) {
      try { const data = await fileToJpeg(f); S.cur.photos.push({ data, src: data }); renderPhoto(); }
      catch (err) { toast("Ek photo khul nahi payi. JPG ya PNG try karo."); }
    }
  });
  $("#pfDelete").addEventListener("click", () => {
    if (S.busy) return;
    const b = $("#pfDelete");
    if (b.classList.contains("armed")) { removeProduct(S.cur.id); return; }
    b.classList.add("armed"); b.textContent = "Pakka hatana hai? Dobara dabao";
    setTimeout(() => { b.classList.remove("armed"); b.textContent = "Ye kapda hata do"; }, 4000);
  });

  // ---------- Start ----------
  (async function start() {
    $("#repoIn").value = store.get("rudra-admin-repo") || guessRepo();
    $("#noticeLink").href = $("#storeLink").href;
    const token = store.get("rudra-admin-token"), repo = store.get("rudra-admin-repo");
    if (token && repo) {
      try { await connect(repo, token); showHome(""); afterConnect(); return; }
      catch (e) {
        if (e.status === 401) store.del("rudra-admin-token");
        const err = $("#setupErr"); err.textContent = explain(e); err.hidden = false;
      }
    }
    show("setup");
  })();
