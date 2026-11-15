# t3.sh: installs T3 Code, which runs in the background and lets you use your
# coding agents from your phone or a browser, and connects it to your devices
# with T3 Connect, which needs no open ports.

T3_APP_URL=https://t3.codes/mobile # T3 Code's phone app, in the App Store or Google Play
T3_SETTINGS=.t3/userdata/settings.json # in your home folder
PROJECTS_DIR=work # in your home folder, where T3 Code adds projects

# enable_linger USER: has systemd start USER's services at boot, and keep them
# running when USER isn't logged in, as T3 Code runs as one. Runs as root.
enable_linger() {
  step "Keep $1's services running when $1 isn't logged in, for T3 Code"
  [[ -e /var/lib/systemd/linger/$1 ]] || run loginctl enable-linger "$1"
  ok "$1's services start when the server does."
}

# setup_t3: installs T3 Code, in ~/.t3 with t3 in ~/.local/bin, then has it
# run in the background, connected to your devices with T3 Connect, which logs
# in with a code. Then helps you set up its phone app. Runs as your user.
setup_t3() {
  step "Install T3 Code, and connect it to your devices"
  local t3=$HOME/.local/bin/t3
  if [[ ! -x $t3 ]]; then
    info "T3 Code lets you use your coding agents from your phone, or any browser at app.t3.codes. It runs here in the background, and T3 Connect lets your devices reach it without opening any ports."
    if ! run_installer https://t3.codes/install.sh setsid -w sh SCRIPT || [[ ! -x $t3 ]]; then
      warn "T3 Code couldn't install, as it says above. Run rembox setup again later."
      return
    fi
  fi
  t3_settings
  if t3_connected "$t3"; then
    ok "T3 Code $(version_of "$t3") runs in the background, and your devices reach it through T3 Connect. To get its phone app: $T3_APP_URL"
    return
  fi
  info "T3 Connect logs in with a code: open the link it shows on any device, check the code matches, and approve."
  log_in "t3 up --connect --no-lan" "$t3" up --connect --no-lan
  t3_connected "$t3" || return 0
  ok "T3 Code $(version_of "$t3") runs in the background, and your devices reach it through T3 Connect."
  setup_phone
}

# t3_connected T3: succeeds if T3 Code runs in the background, with T3 Connect.
t3_connected() {
  "$1" status --json 2>/dev/null | jq -e '.service.installed and .connect.enabled' >/dev/null
}

# t3_settings: sets T3 Code to add projects in ~/PROJECTS_DIR, and turns on Pi
# and OpenCode, which are off until you turn them on, if they're installed.
# Settings you've changed stay as they are.
t3_settings() {
  local file=$HOME/$T3_SETTINGS old new pi=false opencode=false
  [[ -x $HOME/.local/bin/pi ]] && pi=true
  [[ -x $HOME/.opencode/bin/opencode ]] && opencode=true
  [[ -d $HOME/$PROJECTS_DIR ]] || run mkdir -p "$HOME/$PROJECTS_DIR"
  old='{}'
  if [[ -e $file ]] && ! old=$(jq . "$file"); then
    warn "$file isn't valid JSON, so rembox leaves it as it is."
    return
  fi
  # shellcheck disable=SC2016,SC2088 # $pi and $opencode are jq's; ~ is for T3 Code
  new=$(jq --arg dir "~/$PROJECTS_DIR" --argjson pi "$pi" --argjson opencode "$opencode" '
    .addProjectBaseDirectory //= $dir
    | if $pi then .providerInstances.pi //= {driver: "pi", enabled: true} else . end
    | if $opencode then .providerInstances.opencode //= {driver: "opencode", enabled: true} else . end' <<<"$old")
  if [[ $new != "$old" ]]; then
    [[ -d ${file%/*} ]] || run mkdir -p "${file%/*}"
    put "$file" 600 "$new"
  fi
}

# setup_phone: shows a QR code for T3 Code's phone app, and how to connect it.
setup_phone() {
  step "Set up T3 Code on your phone"
  info "Scan this with your phone's camera to get the T3 Code app, from the App Store or Google Play:"
  printf '\n'
  qrencode -t ANSIUTF8 -m 2 "$T3_APP_URL" | sed 's/^/    /'
  info "Or open $T3_APP_URL on your phone. In the app, sign in to T3 Connect with the same account, and choose $HOSTNAME."
  local answer
  ask answer "Press Enter once the app shows $HOSTNAME" || true
}
