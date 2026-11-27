  // Draws the app icon and the WhatsApp share-preview card on a canvas.
  // The admin app saves these into the repo, so no image files need to be uploaded by hand.
  function fontReady() {
    try { return Promise.all([document.fonts.load('700 100px "Cormorant Garamond"'), document.fonts.load('700 20px "Plus Jakarta Sans"')]).catch(() => {}); }
    catch (e) { return Promise.resolve(); }
  }
  function loadImg(src) {
    return new Promise(res => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  }
  const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
  const SANS = '"Plus Jakarta Sans", system-ui, Arial, sans-serif';

  async function drawIcon(size) {
    await fontReady();
    const c = document.createElement("canvas"); c.width = c.height = size;
    const x = c.getContext("2d");
    x.fillStyle = "#100e0c"; x.fillRect(0, 0, size, size);
    const aw = size * 0.46, ah = size * 0.6, ax = (size - aw) / 2, ay = size * 0.2;
    x.strokeStyle = "#c9a25f"; x.lineWidth = size * 0.02; x.lineJoin = "round";
    x.beginPath(); x.moveTo(ax, ay + ah); x.lineTo(ax, ay + aw / 2); x.arc(size / 2, ay + aw / 2, aw / 2, Math.PI, 0);
    x.lineTo(ax + aw, ay + ah); x.closePath(); x.stroke();
    x.fillStyle = "#c9a25f"; x.textAlign = "center"; x.textBaseline = "alphabetic";
    x.font = "700 " + size * 0.4 + "px " + SERIF; x.fillText("R", size / 2, size * 0.6);
    x.font = "800 " + size * 0.066 + "px " + SANS; if ("letterSpacing" in x) x.letterSpacing = size * 0.012 + "px";
    x.fillText("RUDRA", size / 2, size * 0.725);
    return c.toDataURL("image/png").split(",")[1];
  }

  function archPath(x, X, Y, W, H) {
    const r = W / 2;
    x.beginPath(); x.moveTo(X, Y + H); x.lineTo(X, Y + r); x.arc(X + r, Y + r, r, Math.PI, 0); x.lineTo(X + W, Y + H); x.closePath();
  }

  async function drawOg(srcs) {
    await fontReady();
    const W = 1200, H = 630, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#181410"); g.addColorStop(1, "#0c0a08");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = "#c9a25f"; x.fillRect(0, 0, W, 10);

    x.textBaseline = "alphabetic"; x.textAlign = "left";
    x.fillStyle = "#c9a25f"; x.font = "800 24px " + SANS; if ("letterSpacing" in x) x.letterSpacing = "6px";
    x.fillText("MEN  ·  WOMEN  ·  KIDS", 70, 150);
    if ("letterSpacing" in x) x.letterSpacing = "8px";
    let fs = 138; x.font = "700 " + fs + "px " + SERIF;
    while (x.measureText("FASHION").width > 540 && fs > 60) { fs -= 4; x.font = "700 " + fs + "px " + SERIF; }
    x.fillStyle = "#f3ece1"; x.fillText("RUDRA", 66, 300);
    x.fillStyle = "#c9a25f"; x.fillText("FASHION", 66, 430);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = "#a99f90"; x.font = "600 30px " + SANS;
    x.fillText("Free delivery above ₹699", 70, 502);
    x.fillText("Cash on delivery  ·  Order on WhatsApp", 70, 548);

    const tiles = [[660, 150, 150, 380], [830, 90, 150, 440], [1000, 150, 150, 380]];
    const imgs = await Promise.all((srcs || []).slice(0, 3).map(loadImg));
    for (let i = 0; i < tiles.length; i++) {
      const [X, Y, TW, TH] = tiles[i], im = imgs[i];
      x.save(); archPath(x, X, Y, TW, TH); x.clip();
      if (im) {
        const s = Math.max(TW / im.naturalWidth, TH / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
        x.drawImage(im, X + (TW - w) / 2, Y + (TH - h) / 2, w, h);
      } else { x.fillStyle = "#26211c"; x.fillRect(X, Y, TW, TH); }
      x.restore();
      x.strokeStyle = "#c9a25f"; x.lineWidth = 2; archPath(x, X, Y, TW, TH); x.stroke();
    }
    return c.toDataURL("image/jpeg", 0.86).split(",")[1];
          }
