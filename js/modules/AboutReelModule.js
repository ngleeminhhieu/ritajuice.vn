// Dải ảnh cong cho section Về chúng tôi (trang chủ) — tự viết bằng WebGL thuần, lấy cảm hứng từ dải ảnh của
// anfalova.art. Dải ảnh đứng yên (người dùng chọn dạng tĩnh như tham chiếu): đoạn giữa phẳng rộng, gần hai mép mới
// bẻ cong gắt — đầu phải dựng lên, đầu trái cắm xuống, hai đầu lao về phía người xem, mờ nhòe + trong suốt dần và
// tách màu RGB. Kéo chuột / vuốt để tua (có quán tính),
// kéo càng nhanh càng cong và tách màu mạnh. Bấm (không kéo) vào một thẻ thì mở album bằng Fancybox tại ảnh đó: thẻ trên canvas bị bẻ
// cong nên vị trí bấm được dò bằng cách chiếu khung thẻ y như vertex shader (project) rồi xét điểm nằm trong đa giác.
// Dải có tabindex: Enter / Space mở album tại thẻ đang ở giữa. Không có WebGL (hoặc shader lỗi) thì giữ nguyên dải ảnh DOM chạy marquee bằng CSS.
// Kích thước thẻ / khe lấy từ dải DOM (CSS --reel-card-w, --reel-gap) nên chỉnh trong CSS là đủ.

const VERTEX = `
attribute vec2 aUv;
uniform vec4 uRect;
uniform vec2 uView;
uniform float uFlat;
uniform float uBend;
uniform float uRise;
uniform float uDrop;
uniform float uDepth;
varying vec2 vUv;
varying float vEdge;

void main() {
  vec2 p = uRect.xy + aUv * uRect.zw;
  float nx = p.x / uView.x * 2.0 - 1.0;
  // Đoạn giữa phẳng; gần hai mép mới bẻ cong gắt: đầu phải dựng lên, đầu trái cắm xuống, cả hai lao về phía người xem
  float tl = clamp((-nx - uFlat) / (1.0 - uFlat), 0.0, 1.6);
  float tr = clamp((nx - uFlat) / (1.0 - uFlat), 0.0, 1.6);
  float z = uBend * (tl * tl + tr * tr);
  float y = uRise * tr * tr - uDrop * tl * tl;
  vec2 pos = vec2(p.x - uView.x * 0.5, uView.y * 0.5 - p.y + y);
  float w = (uDepth - z) / uDepth;
  gl_Position = vec4(pos.x / (uView.x * 0.5), pos.y / (uView.y * 0.5), 0.0, w);
  vUv = aUv;
  vEdge = max(tl, tr);
}
`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uRadius;
uniform float uShift;
uniform float uBlur;
uniform vec2 uFade;
uniform vec2 uCrop;
varying vec2 vUv;
varying float vEdge;

vec3 blurred(vec2 uv, float r) {
  vec2 d = vec2(r, r) * 0.7071;
  vec3 c = texture2D(uTex, uv).rgb * 0.2;
  c += texture2D(uTex, uv + vec2(r, 0.0)).rgb * 0.1;
  c += texture2D(uTex, uv - vec2(r, 0.0)).rgb * 0.1;
  c += texture2D(uTex, uv + vec2(0.0, r)).rgb * 0.1;
  c += texture2D(uTex, uv - vec2(0.0, r)).rgb * 0.1;
  c += texture2D(uTex, uv + d).rgb * 0.1;
  c += texture2D(uTex, uv - d).rgb * 0.1;
  c += texture2D(uTex, uv + vec2(d.x, -d.y)).rgb * 0.1;
  c += texture2D(uTex, uv - vec2(d.x, -d.y)).rgb * 0.1;
  return c;
}

void main() {
  vec2 px = vUv * uSize;
  vec2 q = min(px, uSize - px);
  float d = length(max(vec2(uRadius) - q, 0.0)) - uRadius;
  float alpha = 1.0 - smoothstep(-0.75, 0.75, d);
  // Hai đầu dải mờ nhòe (blur) và trong suốt dần
  alpha *= 1.0 - smoothstep(uFade.x, uFade.y, vEdge);
  float e = vEdge * vEdge;
  // Ảnh phủ kín thẻ kiểu cover (cắt phần thừa theo tỉ lệ ảnh / thẻ)
  vec2 uv = (vUv - 0.5) * uCrop + 0.5;
  vec2 off = vec2(uShift * (0.12 + e), 0.0);
  float r = uBlur * e;
  vec3 col;
  if (r < 0.0015) {
    col = vec3(texture2D(uTex, uv + off).r, texture2D(uTex, uv).g, texture2D(uTex, uv - off).b);
  } else {
    col = vec3(blurred(uv + off, r).r, blurred(uv, r).g, blurred(uv - off, r).b);
  }
  gl_FragColor = vec4(col, 1.0) * alpha;
}
`;

const MAX_VELOCITY = 4200;      // px/giây
const FLAT = 0.58;              // nửa bề ngang đoạn giữa phẳng (−1..1 theo bề ngang canvas); ngoài đó bẻ cong gắt
const BEND = 0.24;              // hai đầu lao về phía người xem, tính theo bề ngang canvas
const RISE = 1.35;              // đầu phải vút lên, tính theo chiều cao thẻ
const DROP = 0.6;               // đầu trái cắm xuống, tính theo chiều cao thẻ
const SHIFT = 0.007;           // tách màu cơ bản (đơn vị UV)
const BLUR = 0.03;              // độ nhòe ở hai đầu (đơn vị UV, tăng theo độ cong)
const FADE = [0.45, 1.5];       // hai đầu trong suốt dần: bắt đầu → hết hẳn (theo độ cong 0..1.6)
const SEGMENTS_X = 28;
const SEGMENTS_Y = 6;

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
};

const createProgram = (gl) => {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
};

const createGrid = (gl) => {
  const uvs = [];
  const indices = [];
  for (let y = 0; y <= SEGMENTS_Y; y += 1) {
    for (let x = 0; x <= SEGMENTS_X; x += 1) uvs.push(x / SEGMENTS_X, y / SEGMENTS_Y);
  }
  const row = SEGMENTS_X + 1;
  for (let y = 0; y < SEGMENTS_Y; y += 1) {
    for (let x = 0; x < SEGMENTS_X; x += 1) {
      const a = y * row + x;
      indices.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }
  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  return { uvBuffer, count: indices.length };
};

const createTexture = (gl, src) => {
  const texture = gl.createTexture();
  const item = { texture, ratio: 7 / 4 };
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Màu đỏ sẫm tạm (hợp nền tối của section) trong lúc ảnh chưa tải xong
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([94, 32, 28, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    item.ratio = image.naturalWidth / image.naturalHeight || item.ratio;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  };
  image.src = src;
  return item;
};

export default function AboutReelModule() {
  const reel = document.querySelector(".aboutReelJS");
  const list = reel?.querySelector(".about-reel__list");
  if (!reel || !list) return;

  const sources = [...new Set([...list.querySelectorAll("img")].map((img) => img.src))];
  if (!sources.length) return;

  // Album ảnh (Fancybox v4, nạp riêng ở trang chủ)
  const openGallery = (index) => {
    if (!window.Fancybox?.show) return;
    window.Fancybox.show(sources.map((src) => ({ src, type: "image" })), {
      startIndex: index,
      dragToClose: true,
      Thumbs: false,
      l10n: {
        CLOSE: "Đóng",
        NEXT: "Ảnh sau",
        PREV: "Ảnh trước",
        MODAL: "Nhấn Esc để đóng",
        ERROR: "Không tải được nội dung, vui lòng thử lại",
        IMAGE_ERROR: "Không tải được ảnh",
        TOGGLE_ZOOM: "Phóng to / thu nhỏ",
        TOGGLE_SLIDESHOW: "Tự chạy",
        TOGGLE_FULLSCREEN: "Toàn màn hình",
        DOWNLOAD: "Tải xuống",
      },
    });
  };

  // Không có WebGL: dải ảnh DOM chạy marquee, bấm ảnh vẫn mở album
  const fallback = () => {
    [...list.children].forEach((item, i) => item.addEventListener("click", () => openGallery(i % sources.length)));
    reel.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openGallery(0);
    });
  };

  const canvas = document.createElement("canvas");
  canvas.className = "about-reel__canvas";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
  const program = gl && createProgram(gl);
  if (!program) {
    fallback();
    return;
  }

  reel.append(canvas);
  reel.classList.add("is-gl");

  gl.useProgram(program);
  const grid = createGrid(gl);
  const aUv = gl.getAttribLocation(program, "aUv");
  gl.bindBuffer(gl.ARRAY_BUFFER, grid.uvBuffer);
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  const uniform = (name) => gl.getUniformLocation(program, name);
  const u = {
    rect: uniform("uRect"), view: uniform("uView"), flat: uniform("uFlat"), bend: uniform("uBend"),
    rise: uniform("uRise"), drop: uniform("uDrop"), depth: uniform("uDepth"), size: uniform("uSize"),
    radius: uniform("uRadius"), shift: uniform("uShift"), blur: uniform("uBlur"), fade: uniform("uFade"),
    crop: uniform("uCrop"),
  };
  gl.uniform1i(uniform("uTex"), 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const textures = sources.map((src) => createTexture(gl, src));

  const card = list.querySelector("li");
  const view = { w: 0, h: 0, dpr: 1, cardW: 0, cardH: 0, gap: 16, radius: 4, top: 0 };
  const shape = { depth: 1, bend: 0, rise: 0, drop: 0 };
  let drawn = [];

  const measure = () => {
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.w = canvas.clientWidth;
    view.h = canvas.clientHeight;
    view.cardW = card.offsetWidth;
    view.cardH = card.offsetHeight;
    // Canvas cao hơn dải (chừa chỗ mép thẻ phóng to / nhấc lên): vị trí dải tính theo khoảng lệch thật
    view.top = reel.getBoundingClientRect().top - canvas.getBoundingClientRect().top;
    view.gap = parseFloat(getComputedStyle(list).columnGap) || 16;
    view.radius = parseFloat(getComputedStyle(card.querySelector("img")).borderTopLeftRadius) || 4;
    canvas.width = Math.round(view.w * view.dpr);
    canvas.height = Math.round(view.h * view.dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  let offset = 0;
  let velocity = 0;
  let last = 0;
  let frame = 0;
  let visible = false;

  const draw = () => {
    const { w, h, cardW, cardH, gap, radius, top } = view;
    if (!w || !cardW) return;
    const energy = Math.min(Math.abs(velocity) / MAX_VELOCITY, 1);
    // Màn hẹp chỉ chứa ~2 thẻ nên phần lớn dải nằm ở vùng cong: giảm độ cong theo bề ngang
    const scale = Math.min(1, Math.max(0.45, (w - 400) / 800));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.view, w, h);
    shape.depth = w * 1.15;
    shape.bend = w * BEND * scale * (1 + energy * 0.6);
    shape.rise = cardH * RISE * scale * (1 + energy * 0.25);
    shape.drop = cardH * DROP * scale * (1 + energy * 0.25);
    gl.uniform1f(u.depth, shape.depth);
    gl.uniform1f(u.flat, FLAT);
    gl.uniform1f(u.bend, shape.bend);
    gl.uniform1f(u.rise, shape.rise);
    gl.uniform1f(u.drop, shape.drop);
    gl.uniform1f(u.shift, SHIFT + energy * 0.012);
    gl.uniform1f(u.blur, BLUR * (1 + energy));
    gl.uniform2f(u.fade, FADE[0], FADE[1]);
    gl.uniform2f(u.size, cardW, cardH);
    gl.uniform1f(u.radius, radius);

    const step = cardW + gap;
    const total = step * textures.length;
    const shift = ((offset % total) + total) % total;
    const first = Math.floor(shift / step);
    const startX = -(shift - first * step) - step;
    const count = Math.ceil((w + step * 2) / step) + 1;
    drawn = [];
    for (let k = 0; k < count; k += 1) {
      const x = startX + k * step;
      const index = (first - 1 + k + textures.length * 4) % textures.length;
      drawn.push({ x, index });
      const { texture, ratio } = textures[index];
      const card = cardW / cardH;
      gl.uniform2f(u.crop, ratio > card ? card / ratio : 1, ratio > card ? 1 : ratio / card);
      gl.uniform4f(u.rect, x, top, cardW, cardH);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.drawElements(gl.TRIANGLES, grid.count, gl.UNSIGNED_SHORT, 0);
    }
  };

  // Toạ độ màn hình (theo canvas) của điểm (px, py) trên dải phẳng, y hệt vertex shader
  const project = (px, py) => {
    const { w, h } = view;
    const nx = (px / w) * 2 - 1;
    const tl = Math.min(Math.max((-nx - FLAT) / (1 - FLAT), 0), 1.6);
    const tr = Math.min(Math.max((nx - FLAT) / (1 - FLAT), 0), 1.6);
    const z = shape.bend * (tl * tl + tr * tr);
    const y = shape.rise * tr * tr - shape.drop * tl * tl;
    const k = (shape.depth - z) / shape.depth;
    return [w / 2 + (px - w / 2) / k, h / 2 - (h / 2 - py + y) / k];
  };

  const inside = (poly, x, y) => {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };

  const cardAt = (clientX, clientY) => {
    const box = canvas.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    const { cardW, cardH, top } = view;
    const steps = 12;
    for (const card of drawn) {
      const topEdge = [];
      const bottomEdge = [];
      for (let i = 0; i <= steps; i += 1) {
        const px = card.x + (cardW * i) / steps;
        topEdge.push(project(px, top));
        bottomEdge.push(project(px, top + cardH));
      }
      if (inside(topEdge.concat(bottomEdge.reverse()), x, y)) return card.index;
    }
    return -1;
  };

  // Thẻ đang nằm giữa dải (cho phím Enter / Space)
  const centerCard = () => {
    const middle = view.w / 2;
    const card = drawn.find((c) => c.x <= middle && c.x + view.cardW >= middle) || drawn[0];
    return card ? card.index : 0;
  };

  const tick = (now) => {
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    if (!dragging) {
      offset += velocity * dt;
      velocity *= Math.exp(-dt * 2.6);
      if (Math.abs(velocity) < 1) velocity = 0;
    }
    draw();
    frame = visible ? window.requestAnimationFrame(tick) : 0;
  };

  const start = () => {
    if (!frame) {
      last = 0;
      frame = window.requestAnimationFrame(tick);
    }
  };

  // Kéo / vuốt để tua, thả ra còn quán tính
  let dragging = false;
  let pointerX = 0;
  let pointerT = 0;
  let downX = 0;
  let downY = 0;
  let downT = 0;
  reel.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    downX = event.clientX;
    downY = event.clientY;
    downT = event.timeStamp;
    pointerX = event.clientX;
    pointerT = event.timeStamp;
    velocity = 0;
    reel.classList.add("is-dragging");
    reel.setPointerCapture(event.pointerId);
  });
  reel.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - pointerX;
    const dt = Math.max((event.timeStamp - pointerT) / 1000, 0.008);
    offset -= dx;
    velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, -dx / dt));
    pointerX = event.clientX;
    pointerT = event.timeStamp;
  });
  const release = (event) => {
    if (!dragging) return;
    dragging = false;
    reel.classList.remove("is-dragging");
    if (reel.hasPointerCapture(event.pointerId)) reel.releasePointerCapture(event.pointerId);
  };
  reel.addEventListener("pointerup", (event) => {
    const tap = dragging && Math.hypot(event.clientX - downX, event.clientY - downY) < 6 && event.timeStamp - downT < 500;
    release(event);
    if (!tap) return;
    const index = cardAt(event.clientX, event.clientY);
    if (index >= 0) {
      velocity = 0;
      openGallery(index);
    }
  });
  reel.addEventListener("pointercancel", release);
  reel.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openGallery(centerCard());
  });

  measure();
  // Lúc đầu đặt một thẻ nằm chính giữa
  offset = -(view.w - view.cardW) / 2;
  if ("ResizeObserver" in window) new ResizeObserver(() => { measure(); draw(); }).observe(reel);
  else window.addEventListener("resize", () => { measure(); draw(); }, { passive: true });

  // Chỉ chạy vòng vẽ khi section đang trong màn hình
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    }, { rootMargin: "200px 0px" }).observe(reel);
  } else {
    visible = true;
    start();
  }
}
