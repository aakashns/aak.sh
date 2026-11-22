export function initUpdates(notify) {
  const button = document.getElementById("update");
  const dialog = document.getElementById("update-dialog");
  const selector = 'meta[name="collager-version"]';
  const runningVersion = document.querySelector(selector).content;
  let pending;

  async function check() {
    const response = await fetch("./index.html", {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Update check failed");
    const page = new DOMParser().parseFromString(await response.text(), "text/html");
    const version = page.querySelector(selector)?.content;
    if (!version) throw new Error("Missing app version");

    const available = version !== runningVersion;
    const label = available ? "Update available" : "Check for updates";
    button.toggleAttribute("data-available", available);
    button.setAttribute("aria-label", label);
    button.title = label;
    return available;
  }

  function checkOnce() {
    pending ??= check().finally(() => { pending = null; });
    return pending;
  }

  function backgroundCheck() {
    if (!document.hidden) checkOnce().catch(() => {});
  }
  backgroundCheck();
  document.addEventListener("visibilitychange", backgroundCheck);
  window.addEventListener("online", backgroundCheck);
  setInterval(backgroundCheck, 5 * 60 * 1000);

  button.onclick = async () => {
    button.disabled = true;
    try {
      if (await checkOnce()) dialog.showModal();
      else notify("You’re on the latest version.");
    } catch {
      notify("Couldn’t check for updates. Try again when you’re online.");
    } finally {
      button.disabled = false;
    }
  };
  document.getElementById("reload-app").onclick = () => location.reload();
}
