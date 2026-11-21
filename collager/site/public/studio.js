import { frames } from "./frames.js";
const $ = (id) => document.getElementById(id);
const icons = {
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2.1-2.5 4M12 17h.01"/>',
  scan: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
  images:
    '<rect x="6" y="3" width="15" height="15" rx="2"/><path d="M3 8v11a2 2 0 0 0 2 2h12M7 15l4-5 3 3 2-2 4 5"/><circle cx="16" cy="7" r="1"/>',
  sliders:
    '<path d="M3 7h5m5 0h8M3 17h10m5 0h3"/><circle cx="10.5" cy="7" r="2.5"/><circle cx="15.5" cy="17" r="2.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
};
document.querySelectorAll("[data-icon]").forEach((el) => {
  el.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    icons[el.dataset.icon] +
    "</svg>";
});

const canvas = $("canvas");
const ctx = canvas.getContext("2d");
const shapes = {
  Square: { width: 2400, height: 2400, ratio: "1:1" },
  Landscape: { width: 2400, height: 1800, ratio: "4:3" },
  Portrait: { width: 1800, height: 2400, ratio: "3:4" },
};
let shape = "Landscape";
const palette = [
  ["Carbon", "#212020"],
  ["Ivory", "#f5edda"],
  ["Apricot", "#e6ab78"],
  ["Rose", "#cc949b"],
  ["Sage", "#a3b49a"],
  ["Sky", "#91afc3"],
];
const samples = ["village", "fruit", "coast", "italy", "lake", "forest"];
const sampleImages = [];
const personal = Array(6).fill(null);
let count = 3,
  frame = "Wildflower",
  color = 1,
  demo = true,
  busy = false,
  target = null;
let messageTimer;
function notify(text) {
  clearTimeout(messageTimer);
  $("message").textContent = text;
  messageTimer = setTimeout(() => {
    $("message").textContent = "";
  }, 6000);
}

function photoAt(i) {
  return demo ? sampleImages[i] : personal[i];
}

function drawFilmDetails(ink) {
  ctx.fillStyle = ink;
  for (let i = 0; i < canvas.width / 100; i++) {
    for (const y of [19, canvas.height - 46]) {
      ctx.beginPath();
      ctx.roundRect(26 + i * 100, y, 49, 27, 6);
      ctx.fill();
    }
  }
  ctx.font = "600 24px monospace";
  ctx.textBaseline = "middle";
  for (const [i, label] of [
    "COLLAGER  400",
    "COLOR NEGATIVE",
    "FRAME  01   ▸",
  ].entries()) {
    ctx.fillText(label, 35 + (i * canvas.width) / 3, 75);
  }
  for (const [i, label] of ["01   ▸", "02   ▸", "03   ▸"].entries()) {
    ctx.fillText(label, 35 + (i * canvas.width) / 3, canvas.height - 74);
  }
}

function draw() {
  const { width: W, height: H } = canvas;
  ctx.fillStyle = palette[color][1];
  ctx.fillRect(0, 0, W, H);
  const { margin, top = margin, bottom = top, gap = 28, paint } = frames[frame];
  const cols = count === 6 ? 3 : 2;
  const rows = count === 2 ? 1 : 2;
  const width = (W - 2 * margin - (cols - 1) * gap) / cols;
  const height = (H - top - bottom - (rows - 1) * gap) / rows;
  for (let i = 0; i < count; i++) {
    const col = count === 3 ? Math.min(i, 1) : i % cols;
    const row = count === 3 ? Math.max(0, i - 1) : Math.floor(i / cols);
    const x = margin + col * (width + gap),
      y = top + row * (height + gap);
    const cellHeight = count === 3 && i === 0 ? 2 * height + gap : height;
    const photo = photoAt(i);
    if (photo) {
      const scale = Math.max(width / photo.width, cellHeight / photo.height);
      const sw = width / scale,
        sh = cellHeight / scale;
      ctx.drawImage(
        photo,
        (photo.width - sw) / 2,
        (photo.height - sh) / 2,
        sw,
        sh,
        x,
        y,
        width,
        cellHeight,
      );
    } else {
      ctx.fillStyle = "#464749";
      ctx.fillRect(x, y, width, cellHeight);
      ctx.fillStyle = "#dad8d3";
      ctx.font = "48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Photo " + (i + 1), x + width / 2, y + cellHeight / 2);
      ctx.textAlign = "left";
    }
  }
  if (paint) {
    ctx.save();
    ctx.scale(4, 4);
    paint(ctx, W / 4, H / 4, color === 0);
    ctx.restore();
  }
  if (frame === "Film") drawFilmDetails(color === 0 ? "#e2ae66" : "#514237");
}

function choose(parent, value, label, markup, onSelect) {
  const button = document.createElement("button");
  button.className = "choice";
  button.dataset.value = value;
  button.innerHTML = markup;
  button.append(document.createTextNode(label));
  button.onclick = () => {
    onSelect(value);
    refresh();
  };
  parent.append(button);
}
function setShape(name) {
  shape = name;
  const { width, height, ratio } = shapes[name];
  canvas.width = width;
  canvas.height = height;
  canvas.parentElement.dataset.shape = name;
  $("preview-icon").dataset.shape = name;
  $("shape-name").textContent = name;
  $("ratio").textContent = ratio;
  $("dimensions").textContent = width + " × " + height + " px";
}
for (const name of Object.keys(shapes)) {
  choose(
    $("shapes"),
    name,
    name,
    '<span class="shape-icon" aria-hidden="true" data-shape="' +
      name +
      '"></span>',
    setShape,
  );
}
setShape(shape);
for (const n of [2, 3, 4, 6]) {
  choose(
    $("layouts"),
    n,
    n + " photos",
    '<span aria-hidden="true" class="mini n' +
      n +
      '">' +
      "<b></b>".repeat(n) +
      "</span>",
    (value) => {
      count = value;
    },
  );
}
for (const [name, style] of Object.entries(frames)) {
  choose(
    $("frames"),
    name,
    name,
    style.icon
      ? '<span aria-hidden="true" class="motif">' + style.icon + "</span>"
      : '<span aria-hidden="true" class="frame-icon ' +
          name.toLowerCase() +
          '"></span>',
    (value) => {
      frame = value;
    },
  );
}
palette.forEach(([name, hex], i) => {
  const button = document.createElement("button");
  button.className = "swatch";
  button.setAttribute("aria-label", name);
  button.title = name;
  button.style.setProperty("--color", hex);
  button.dataset.value = i;
  button.onclick = () => {
    color = i;
    refresh();
  };
  $("swatches").append(button);
});

function pick(slot) {
  target = slot;
  $("files").multiple = slot === null;
  $("files").click();
}

function refresh() {
  draw();
  for (const [id, value] of [
    ["shapes", shape],
    ["layouts", count],
    ["frames", frame],
    ["swatches", color],
  ]) {
    for (const button of $(id).children) {
      button.setAttribute(
        "aria-pressed",
        button.dataset.value === String(value),
      );
      button.disabled = busy;
    }
  }
  $("color-name").textContent = palette[color][0];
  $("slots").replaceChildren();
  let filled = 0;
  for (let i = 0; i < count; i++) {
    const photo = photoAt(i);
    const slot = document.createElement("button");
    slot.className = "slot";
    slot.disabled = busy;
    slot.setAttribute(
      "aria-label",
      (photo ? "Replace" : "Add") + " photo " + (i + 1),
    );
    slot.onclick = () => pick(i);
    if (photo) {
      filled++;
      const thumb = document.createElement("img");
      thumb.alt = "";
      thumb.src = photo.src;
      slot.append(thumb);
    } else {
      slot.textContent = "+";
    }
    const number = document.createElement("span");
    number.textContent = i + 1;
    slot.append(number);
    $("slots").append(slot);
  }
  $("add").disabled = busy;
  $("add-label").textContent =
    !demo && filled === count ? "Replace photos" : "Add photos";
  $("download").disabled = busy || filled !== count;
  prepareShare();
  $("photo-note").textContent = busy
    ? "Preparing your photos…"
    : demo
      ? "Sample photos · Add your own to get started."
      : filled < count
        ? "Add " + (count - filled) + " more to finish your collage."
        : "Tap a photo to replace it.";
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function prepare(file) {
  const url = URL.createObjectURL(file);
  try {
    const original = await loadImage(url);
    const scale = Math.min(1, 2400 / Math.max(original.width, original.height));
    const reduced = document.createElement("canvas");
    reduced.width = Math.max(1, Math.round(original.width * scale));
    reduced.height = Math.max(1, Math.round(original.height * scale));
    reduced
      .getContext("2d")
      .drawImage(original, 0, 0, reduced.width, reduced.height);
    const blob = await new Promise((resolve) =>
      reduced.toBlob(resolve, "image/png"),
    );
    if (!blob) throw Error("Image conversion failed");
    const result = URL.createObjectURL(blob);
    try {
      return await loadImage(result);
    } catch (error) {
      URL.revokeObjectURL(result);
      throw error;
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

$("files").onchange = async () => {
  const files = [...$("files").files];
  $("files").value = "";
  if (!files.length) return;
  busy = true;
  refresh();
  const places = Array.from({ length: count }, (_, i) => i);
  const empty = places.filter((i) => !personal[i]);
  const destinations =
    target !== null ? [target] : empty.length ? empty : places;
  let loaded = 0,
    failed = 0,
    examined = 0;
  for (const file of files) {
    if (loaded >= destinations.length) break;
    examined++;
    try {
      const photo = await prepare(file);
      const index = destinations[loaded++];
      if (personal[index]) URL.revokeObjectURL(personal[index].src);
      personal[index] = photo;
      demo = false;
    } catch {
      failed++;
    }
  }
  busy = false;
  refresh();
  if (failed) notify("Some photos could not be opened. Try a JPEG or PNG.");
  else if (examined < files.length)
    notify("Added " + loaded + " photos. This layout is full.");
};
$("add").onclick = () => pick(null);
$("help").onclick = () => $("guide").showModal();
function download(blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "collager-" + count + "-photos.png";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 60000);
}

$("download").onclick = () => {
  canvas.toBlob((blob) => {
    if (blob) download(blob);
    else notify("Could not save the image. Please try again.");
  }, "image/png");
};

// Prepare the file before the tap so mobile browsers retain user activation.
let shareRevision = 0,
  shareTimer,
  shareFile;
function prepareShare() {
  const revision = ++shareRevision;
  clearTimeout(shareTimer);
  shareFile = null;
  $("share").disabled = $("download").disabled;
  if ($("share").disabled || !navigator.canShare) return;
  $("share").disabled = true;
  shareTimer = setTimeout(
    () =>
      canvas.toBlob((blob) => {
        if (revision !== shareRevision) return;
        if (blob)
          shareFile = new File([blob], "collager-" + count + "-photos.png", {
            type: "image/png",
          });
        $("share").disabled = false;
      }, "image/png"),
    80,
  );
}

$("share").onclick = async () => {
  try {
    if (shareFile && navigator.canShare?.({ files: [shareFile] })) {
      await navigator.share({ files: [shareFile] });
    } else {
      if (shareFile) download(shareFile);
      else $("download").click();
      notify("This browser saves the PNG. Open it in Downloads to share.");
    }
  } catch (error) {
    if (error.name !== "AbortError")
      notify("Sharing is unavailable. Tap Download collage to save your PNG.");
  }
};

refresh();
await Promise.all(
  samples.map(async (name, i) => {
    sampleImages[i] = await loadImage("photos/" + name + ".jpg");
    if (demo && i < count) refresh();
  }),
);
