// Draw motifs at a uniform scale in every orientation.
function ellipse(ctx, x, y, rx, ry, angle, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fill();
}

function blossom(ctx, x, y, size, petals, tint) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  for (let i = 0; i < petals; i++) {
    ctx.rotate((2 * Math.PI) / petals);
    ellipse(ctx, 0, -4.6, 2.8, 4.8, 0.14, tint);
  }
  ellipse(ctx, 0, 0, 2.8, 2.8, 0, "#eab34a");
  ctx.restore();
}

function wildflower(ctx, width, height, dark) {
  const stem = dark ? "#a5b580" : "#66734e";
  // Work clockwise so each stem turns naturally into the next corner.
  for (const [x, y, angle, length] of [
    [0, 0, 0, width],
    [width, 0, 90, height],
    [width, height, 180, width],
    [0, height, 270, height],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.strokeStyle = stem;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(14, 14);
    const repeats = Math.round(length / 70);
    const step = (length - 28) / repeats;
    for (let i = 0; i < repeats; i++) {
      const start = 14 + i * step;
      ctx.bezierCurveTo(
        start + step * 0.35,
        2,
        start + step * 0.65,
        26,
        start + step,
        14,
      );
    }
    ctx.stroke();
    for (let i = 0; i < repeats; i++) {
      const start = 14 + i * step;
      ellipse(ctx, start + step * 0.22, 8, 5.7, 2.3, -0.65, stem);
      ellipse(ctx, start + step * 0.7, 21, 5.1, 2.2, 0.52, stem);
      blossom(
        ctx,
        start + step * 0.48,
        13,
        0.72,
        5,
        i % 2 ? "#a887b1" : "#db897a",
      );
    }
    blossom(ctx, 15, 14, 1.16, 9, "#fff8df");
    ctx.restore();
  }
}

function airmail(ctx, width, height) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.rect(10, 10, width - 20, height - 20);
  ctx.clip("evenodd");
  ctx.fillStyle = "#f7ebcd";
  ctx.fillRect(0, 0, width, height);
  ctx.transform(1, 0, -0.65, 1, 0, 0);
  for (let x = 0; x < width + height * 0.65; x += 48) {
    ctx.fillStyle = "#b65846";
    ctx.fillRect(x, 0, 15, height);
    ctx.fillStyle = "#41647a";
    ctx.fillRect(x + 24, 0, 15, height);
  }
  ctx.restore();
  // A cancellation mark crosses the corner of the photographic print.
  ctx.save();
  ctx.translate(width - 53, height - 44);
  ctx.rotate(-0.15);
  ctx.strokeStyle = ctx.fillStyle = "#263f4c";
  ctx.fillStyle = "#f5e6c7";
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, 2 * Math.PI);
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 17.5, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "#263f4c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 7px sans-serif";
  ctx.fillText("AIR MAIL", 0, -3);
  ctx.fillText("✦", 0, 6);
  for (const y of [-7, 0, 7]) {
    ctx.beginPath();
    ctx.moveTo(19, y);
    ctx.bezierCurveTo(26, y - 5, 30, y + 4, 38, y);
    ctx.stroke();
  }
  ctx.restore();
}

function deco(ctx, width, height, dark) {
  const gold = ctx.createLinearGradient(0, 0, width, height);
  const tones = dark
    ? ["#bc8849", "#f7df95", "#ad793b", "#f8d99b"]
    : ["#735125", "#a27a39", "#684d2d", "#997037"];
  tones.forEach((tone, i) => gold.addColorStop(i / 3, tone));
  ctx.strokeStyle = ctx.fillStyle = gold;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.strokeRect(14, 14, width - 28, height - 28);
  for (const [x, y, sx, sy] of [
    [0, 0, 1, 1],
    [width, 0, -1, 1],
    [0, height, 1, -1],
    [width, height, -1, -1],
  ]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    // A stepped lacquer corner with an engraved sunburst.
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(67, 4);
    ctx.lineTo(67, 11);
    ctx.lineTo(53, 11);
    ctx.lineTo(53, 18);
    ctx.lineTo(42, 18);
    ctx.lineTo(18, 42);
    ctx.lineTo(18, 53);
    ctx.lineTo(11, 53);
    ctx.lineTo(11, 67);
    ctx.lineTo(4, 67);
    ctx.closePath();
    ctx.fillStyle = "#293c38";
    ctx.fill();
    ctx.stroke();
    for (let i = 1; i <= 7; i++) {
      const angle = (Math.PI * i) / 16;
      ctx.beginPath();
      ctx.moveTo(9, 9);
      ctx.lineTo(9 + 29 * Math.cos(angle), 9 + 29 * Math.sin(angle));
      ctx.stroke();
    }
    ctx.restore();
  }
}

export const frames = {
  Wildflower: { margin: 112, paint: wildflower, icon: "✿" },
  "Air Mail": { margin: 80, paint: airmail, icon: "✉" },
  "Art Deco": { margin: 90, paint: deco, icon: "✧" },
  Clean: { margin: 35, gap: 20 },
  Film: { margin: 38, top: 106 },
  Print: { margin: 96, bottom: 190 },
};
