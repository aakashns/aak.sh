// Keep each photo's focal point in source-image coordinates across layout changes.
const crops = new WeakMap();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function cropRect(photo, aspect) {
  const { zoom = 1, cx = photo.width / 2, cy = photo.height / 2 } =
    crops.get(photo) ?? {};
  const width = Math.min(photo.width, photo.height * aspect) / zoom;
  const height = Math.min(photo.height, photo.width / aspect) / zoom;
  return {
    x: clamp(cx - width / 2, 0, photo.width - width),
    y: clamp(cy - height / 2, 0, photo.height - height),
    width,
    height,
    zoom,
  };
}

export function drawPhoto(ctx, photo, x, y, width, height) {
  const crop = cropRect(photo, width / height);
  ctx.drawImage(
    photo, crop.x, crop.y, crop.width, crop.height,
    x, y, width, height,
  );
}

export function enableCropGestures(button, getPhoto, redraw, pick) {
  const pointers = new Map();
  let start, moved;

  function position() {
    const [a, b = a] = pointers.values();
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    };
  }

  function rebase() {
    const photo = getPhoto();
    const box = button.getBoundingClientRect();
    const crop = cropRect(photo, box.width / box.height);
    start = { photo, box, crop, ...position() };
  }

  button.onpointerdown = (event) => {
    if (event.button !== 0 || pointers.size >= 2) return;
    if (!pointers.size) moved = false;
    if (!getPhoto()) return;
    pointers.set(event.pointerId, event);
    button.setPointerCapture(event.pointerId);
    if (pointers.size === 2) moved = true;
    rebase();
  };

  button.onpointermove = (event) => {
    if (!pointers.has(event.pointerId) || start.photo !== getPhoto()) return;
    pointers.set(event.pointerId, event);
    const pos = position();
    if (!moved && Math.hypot(pos.x - start.x, pos.y - start.y) < 4) return;
    moved = true;
    const { photo, crop, box } = start;
    const factor = start.distance ? pos.distance / start.distance : 1;
    const zoom = clamp(crop.zoom * factor, 1, 8);
    const width = crop.width * (crop.zoom / zoom);
    const height = crop.height * (crop.zoom / zoom);
    // Keep the source point under the fingers as their midpoint moves.
    const anchorX = crop.x + (start.x - box.left) / box.width * crop.width;
    const anchorY = crop.y + (start.y - box.top) / box.height * crop.height;
    const x = anchorX - (pos.x - box.left) / box.width * width;
    const y = anchorY - (pos.y - box.top) / box.height * height;
    crops.set(photo, {
      cx: clamp(x, 0, photo.width - width) + width / 2,
      cy: clamp(y, 0, photo.height - height) + height / 2,
      zoom,
    });
    redraw();
  };

  function release(event) {
    if (!pointers.delete(event.pointerId)) return;
    if (event.type !== "pointerup") moved = true;
    if (pointers.size && getPhoto()) rebase();
  }
  button.onpointerup = button.onpointercancel = button.onlostpointercapture = release;
  button.onclick = (event) => {
    if (event.detail === 0 || !moved) pick();
  };
}
