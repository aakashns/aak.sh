// The install command's Copy button, shown once there's a clipboard to copy to.
const button = document.querySelector("#copy");
const command = document.querySelector("#install-command");
const status = document.querySelector("#copy-status");

if (button && command && status && navigator.clipboard) {
  button.hidden = false;
  let reset;
  button.addEventListener("click", async () => {
    clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(command.textContent);
      button.textContent = "Copied!";
      status.textContent = "Install command copied to clipboard.";
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(command);
      selection?.removeAllRanges();
      selection?.addRange(range);
      status.textContent = "Select and copy the highlighted command.";
      button.textContent = "Select & copy";
    }
    reset = setTimeout(() => {
      button.textContent = "Copy";
    }, 3000);
  });
}

// The terminal that plays rembox setup: each [data-step] shows after waiting its value in ms, and
// [data-type] ones are typed. Everything stays laid out while hidden, so the box keeps its height.
const termScreen = document.querySelector("#term-screen");
const replay = document.querySelector("#term-replay");

// The page sets .animate, unless you prefer reduced motion.
if (termScreen && replay && document.documentElement.classList.contains("animate")) {
  const steps = [...termScreen.querySelectorAll("[data-step]")];
  for (const step of steps.filter((s) => s.hasAttribute("data-type"))) {
    const chars = [...step.textContent].map((c) => {
      const span = document.createElement("span");
      span.className = "t-char";
      span.textContent = c;
      return span;
    });
    step.replaceChildren(...chars);
  }
  const cursor = document.createElement("span");
  cursor.className = "t-cursor";
  // Scales every wait, to speed it all up or slow it down.
  const pace = 0.8;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms * pace));
  let run = 0;

  const play = async () => {
    const me = ++run;
    termScreen.querySelectorAll(".shown").forEach((el) => el.classList.remove("shown"));
    for (const step of steps) {
      await sleep(Number(step.dataset.step));
      if (me !== run) return;
      step.classList.add("shown");
      // The cursor goes at the end of what shows: before what's still to be typed, or any step
      // inside it still to come.
      const next = step.hasAttribute("data-type")
        ? step.firstChild
        : step.querySelector("[data-step]:not(.shown)");
      step.insertBefore(cursor, next);
      if (step.hasAttribute("data-type")) {
        for (const char of step.querySelectorAll(".t-char")) {
          await sleep(50 + Math.random() * 60);
          if (me !== run) return;
          char.classList.add("shown");
          char.after(cursor);
        }
      }
    }
    cursor.remove();
  };

  replay.addEventListener("click", play);
  // Starts once you can see it.
  new IntersectionObserver((entries, observer) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      play();
    }
  }, { threshold: 0.3 }).observe(termScreen);
}
