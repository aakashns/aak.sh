const button = document.getElementById("install");
const hint = document.getElementById("install-help");
const standalone = window.matchMedia("(display-mode: standalone)");
let pendingPrompt;
function update() {
  button.hidden = standalone.matches || navigator.standalone === true;
  hint.hidden = true;
}
update();
standalone.addEventListener("change", update);
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  pendingPrompt = event;
});
window.addEventListener("appinstalled", () => {
  pendingPrompt = null;
  button.hidden = hint.hidden = true;
});
button.onclick = async () => {
  if (pendingPrompt) {
    const prompt = pendingPrompt;
    pendingPrompt = null;
    try {
      await prompt.prompt();
      return;
    } catch {
      /* Show browser instructions when the prompt is unavailable. */
    }
  }
  hint.hidden = false;
  const appleMobile =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  hint.textContent = appleMobile
    ? "In Safari, open Share and choose Add to Home Screen. Turn on Open as Web App if shown, then tap Add."
    : "In your browser menu, choose Install app or Add to Home screen. If neither appears, you can bookmark this page.";
};
