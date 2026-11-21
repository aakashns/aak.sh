// Store centers as fractions of the image so positions survive shape changes.
export function captionEditor(canvas, redraw) {
  const print = canvas.parentElement;
  const dialog = document.getElementById("text-editor");
  const input = document.getElementById("caption");
  const color = document.getElementById("text-color");
  const remove = document.getElementById("delete-text");
  const captions = [];
  let editing;

  function open(caption) {
    editing = caption;
    document.getElementById("text-title").textContent = caption
      ? "Edit text"
      : "Add text";
    input.value = caption?.text ?? "";
    color.value = caption?.color ?? "#ffffff";
    remove.hidden = !caption;
    dialog.showModal();
    input.focus();
  }
  document.getElementById("add-text").onclick = () => open(null);
  document.getElementById("cancel-text").onclick = () => dialog.close();
  remove.onclick = () => {
    editing.button.remove();
    captions.splice(captions.indexOf(editing), 1);
    dialog.close();
    redraw();
  };
  document.getElementById("text-form").onsubmit = (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    const caption = editing ?? createCaption();
    Object.assign(caption, { text, color: color.value });
    caption.button.setAttribute("aria-label", "Edit text: " + text);
    dialog.close();
    redraw();
  };

  function createCaption() {
    const button = document.createElement("button");
    button.className = "caption-handle";
    button.title = "Drag to move · Tap to edit";
    const caption = { button, x: 0.5, y: 0.45 + (captions.length % 4) * 0.1 };
    captions.push(caption);
    print.append(button);
    let drag;
    let moved = false;
    button.onpointerdown = (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      const inverse = new DOMMatrix(
        getComputedStyle(print).transform,
      ).inverse();
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: caption.x,
        y: caption.y,
        inverse,
      };
      moved = false;
      button.setPointerCapture(event.pointerId);
    };
    button.onpointermove = (event) => {
      if (drag?.id !== event.pointerId) return;
      const dx = event.clientX - drag.startX,
        dy = event.clientY - drag.startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      // Undo the print's rotation before converting screen distance to canvas units.
      const delta = new DOMPoint(dx, dy, 0, 0).matrixTransform(drag.inverse);
      caption.x = drag.x + delta.x / canvas.clientWidth;
      caption.y = drag.y + delta.y / canvas.clientHeight;
      redraw();
    };
    button.onlostpointercapture = () => {
      drag = null;
    };
    button.onpointerup = (event) => {
      if (drag?.id === event.pointerId && !moved) open(caption);
    };
    button.onclick = (event) => {
      if (event.detail === 0 && !dialog.open) open(caption);
    };
    button.onkeydown = (event) => {
      const steps = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const step = steps[event.key];
      if (!step) return;
      event.preventDefault();
      caption.x += step[0] * 0.01;
      caption.y += step[1] * 0.01;
      redraw();
    };
    return caption;
  }

  return function paint(ctx) {
    const { width, height } = canvas;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const caption of captions) {
      let size = Math.min(width, height) * 0.08;
      ctx.font = "bold " + size + "px sans-serif";
      size *= Math.min(1, (width * 0.94) / ctx.measureText(caption.text).width);
      ctx.font = "bold " + size + "px sans-serif";
      const textWidth = ctx.measureText(caption.text).width;
      const halfWidth = (textWidth / 2 + 10) / width;
      const halfHeight = (size * 0.65 + 10) / height;
      caption.x = Math.max(halfWidth, Math.min(1 - halfWidth, caption.x));
      caption.y = Math.max(halfHeight, Math.min(1 - halfHeight, caption.y));
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = caption.color;
      ctx.fillText(caption.text, caption.x * width, caption.y * height);
      Object.assign(caption.button.style, {
        left: caption.x * 100 + "%",
        top: caption.y * 100 + "%",
        width: halfWidth * 200 + "%",
        height: halfHeight * 200 + "%",
      });
    }
    ctx.restore();
  };
}
