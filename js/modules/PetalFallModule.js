// Hiệu ứng cánh hoa mai / hoa đào rơi (bật trong bảng Trang trí Tết). Cánh hoa tách từ file SVG người dùng gửi
// (cánh mai.svg, cánh đào.svg), gộp thành sprite petals-mai.webp / petals-dao.webp; FRAMES là toạ độ từng cánh
// [x, y, w, h] trong sprite. Vẽ bằng một canvas phủ màn hình (.petal-fall), mỗi cánh rơi chậm, lắc ngang, xoay và lật.
// Chỉ chạy khi trang trí bật, hoa rơi bật và tab đang hiện; đổi loại hoa thì nạp sprite tương ứng.

const FRAMES = {
  mai: [[2, 2, 62, 43], [66, 2, 38, 26], [106, 2, 45, 28], [153, 2, 44, 30], [199, 2, 42, 32], [243, 2, 45, 59],
    [290, 2, 30, 31], [322, 2, 61, 53], [385, 2, 47, 27], [434, 2, 43, 34], [479, 2, 47, 41], [528, 2, 47, 22],
    [577, 2, 31, 30], [610, 2, 20, 36], [632, 2, 31, 24], [665, 2, 34, 26], [701, 2, 59, 59], [762, 2, 30, 52],
    [794, 2, 14, 21], [810, 2, 15, 22], [827, 2, 12, 18], [841, 2, 16, 19], [859, 2, 29, 42], [890, 2, 45, 37]],
  dao: [[2, 2, 54, 67], [58, 2, 41, 29], [101, 2, 62, 59], [165, 2, 37, 38], [204, 2, 32, 44], [238, 2, 41, 36],
    [281, 2, 51, 70], [334, 2, 50, 71], [386, 2, 78, 59], [466, 2, 56, 79], [524, 2, 76, 57], [602, 2, 38, 27],
    [642, 2, 29, 35], [673, 2, 64, 47]],
};

const SPRITES = {
  mai: new URL("../../assets/images/petals-mai.webp", import.meta.url).href,
  dao: new URL("../../assets/images/petals-dao.webp", import.meta.url).href,
};

const PX_PER_PETAL = 52;    // mật độ: một cánh cho mỗi 52 px bề ngang
const MIN_PETALS = 10;
const MAX_PETALS = 32;
const WIND = 14;            // gió đẩy nhẹ sang phải, px/giây
// Cánh mai trong file gốc nhỏ hơn cánh đào: mỗi loại một khoảng tỉ lệ để cỡ cánh khi rơi tương đương
const SCALE = { mai: [0.34, 0.64], dao: [0.24, 0.46] }; // người dùng thấy to: ≈ 12–38 px

const random = (min, max) => min + Math.random() * (max - min);

export default function PetalFallModule() {
  const root = document.documentElement;
  const canvas = document.createElement("canvas");
  canvas.className = "petal-fall";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  document.body.append(canvas);

  const sprites = {};
  let kind = "";
  let petals = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let last = 0;

  const flower = () => (root.dataset.flower === "dao" ? "dao" : "mai");
  const enabled = () => !root.classList.contains("decor-off") && !root.classList.contains("petals-off") && !document.hidden;

  const spawn = (petal, top) => {
    const frames = FRAMES[kind];
    petal.frame = frames[Math.floor(Math.random() * frames.length)];
    petal.scale = random(...SCALE[kind]);
    petal.baseX = random(-40, width + 20);
    petal.y = top ? random(-height, height) : random(-80, -30);
    petal.vy = random(32, 70);
    petal.amp = random(18, 56);
    petal.freq = random(0.5, 1.3);
    petal.phase = random(0, Math.PI * 2);
    petal.rot = random(0, Math.PI * 2);
    petal.vrot = random(-1.4, 1.4);
    petal.flip = random(1.2, 2.8);
    petal.alpha = random(0.75, 1);
    return petal;
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const count = Math.max(MIN_PETALS, Math.min(MAX_PETALS, Math.round(width / PX_PER_PETAL)));
    if (!kind) return;
    while (petals.length < count) petals.push(spawn({}, true));
    petals.length = count;
  };

  const draw = (time) => {
    const sprite = sprites[kind];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!sprite?.complete) return;
    const t = time / 1000;
    petals.forEach((p) => {
      const [fx, fy, fw, fh] = p.frame;
      const x = p.baseX + Math.sin(t * p.freq + p.phase) * p.amp;
      const flip = Math.cos(t * p.flip + p.phase);
      ctx.globalAlpha = p.alpha;
      ctx.setTransform(dpr, 0, 0, dpr, x * dpr, p.y * dpr);
      ctx.rotate(p.rot);
      ctx.scale(p.scale * (0.35 + 0.65 * Math.abs(flip)), p.scale);
      ctx.drawImage(sprite, fx, fy, fw, fh, -fw / 2, -fh / 2, fw, fh);
    });
    ctx.globalAlpha = 1;
  };

  const tick = (time) => {
    const dt = Math.min((time - (last || time)) / 1000, 0.05);
    last = time;
    petals.forEach((p) => {
      p.y += p.vy * dt;
      p.baseX += WIND * dt;
      p.rot += p.vrot * dt;
      if (p.y > height + 60 || p.baseX > width + 80) spawn(p, false);
    });
    draw(time);
    frame = window.requestAnimationFrame(tick);
  };

  const stop = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const update = () => {
    if (!enabled()) {
      stop();
      return;
    }
    const next = flower();
    if (next !== kind) {
      kind = next;
      if (!sprites[kind]) {
        sprites[kind] = new Image();
        sprites[kind].decoding = "async";
        sprites[kind].src = SPRITES[kind];
      }
      petals = [];
      resize();
    }
    if (!frame) frame = window.requestAnimationFrame(tick);
  };

  window.addEventListener("resize", () => {
    if (kind) resize();
  }, { passive: true });
  document.addEventListener("visibilitychange", update);
  document.addEventListener("decor:change", update);
  update();
}
