# agents.sh: installs the coding agents you choose, Claude Code, Codex, OpenCode
# and Pi, each with its own install script and its defaults, then logs them in
# with their own commands. They update themselves, or say how, so running setup
# again doesn't upgrade them; it offers to log them in again.

# setup_agents: asks about each agent in turn. Runs as your user.
setup_agents() {
  ((EUID != 0)) || fail "Run this as your user, not root."
  # As in your login shell: the installers put their commands in ~/.local/bin,
  # and Pi's needs Node, from Vite+.
  export PATH=$HOME/.local/bin:$HOME/.local/share/vite-plus/bin:$PATH
  setup_claude
  setup_codex
  setup_opencode
  setup_pi
}

# setup_claude: installs Claude Code, in ~/.local/bin, and logs it in, with a
# link, to your Claude subscription.
setup_claude() {
  step "Install Claude Code"
  local claude=$HOME/.local/bin/claude logged_in=no
  install_agent "Claude Code" "Anthropic's coding agent" "$claude" https://claude.ai/install.sh bash || return 0
  "$claude" auth status >/dev/null 2>&1 && logged_in=yes
  offer_login "Claude Code" $logged_in \
    "Claude Code logs in with a link: open it on any device, sign in, and paste the code it shows back here. To log in to an Anthropic Console account instead, billed by API usage: claude auth login --console" \
    "claude auth login" "$claude" auth login
}

# setup_codex: installs Codex, in ~/.local/bin, and logs it in, with a code, to
# your ChatGPT account.
setup_codex() {
  step "Install Codex"
  local codex=$HOME/.local/bin/codex logged_in=no
  install_agent Codex "OpenAI's coding agent" "$codex" https://chatgpt.com/codex/install.sh sh || return 0
  "$codex" login status >/dev/null 2>&1 && logged_in=yes
  offer_login Codex $logged_in "Codex logs in with a code: open the link it shows on any device, and enter the code." \
    "codex login --device-auth" "$codex" login --device-auth
}

# setup_opencode: installs OpenCode, in ~/.opencode/bin, and logs it in to the
# model provider you pick in its menu, with a link or an API key.
setup_opencode() {
  step "Install OpenCode"
  local opencode=$HOME/.opencode/bin/opencode logged_in=no
  install_agent OpenCode "an open-source coding agent that works with many model providers" \
    "$opencode" https://opencode.ai/v2/install bash || return 0
  "$opencode" auth list --format json 2>/dev/null | jq -e 'length > 0' >/dev/null && logged_in=yes
  offer_login OpenCode $logged_in "OpenCode asks which model provider to log in to, then shows a link, or asks for an API key." \
    "opencode auth login" "$opencode" auth login
}

# setup_pi: installs Pi, in ~/.pi/agent, with pi in ~/.local/bin. You log it in
# from inside Pi.
setup_pi() {
  step "Install Pi"
  install_agent Pi "a small coding agent you can extend" "$HOME/.local/bin/pi" https://pi.dev/install.sh sh || return 0
  ok "To log Pi in to a model provider: run pi, then type /login."
}

# install_agent NAME WHAT COMMAND URL SHELL: unless COMMAND is there, asks
# whether to install NAME (WHAT it is), then runs its install script, from URL,
# with SHELL. Fails if NAME isn't installed.
install_agent() {
  local name=$1 what=$2 command=$3 url=$4 shell=$5
  if [[ ! -x $command ]]; then
    if ! confirm "Install $name, $what?" yes; then
      ok "$name isn't installed. To install it later, run rembox setup again."
      return 1
    fi
    # setsid runs the script without a terminal, as in a script, so it takes
    # its defaults instead of asking, like whether to start the agent now.
    if ! run_installer "$url" setsid -w "$shell" SCRIPT || [[ ! -x $command ]]; then
      warn "$name couldn't install, as it says above. Run rembox setup again later."
      return 1
    fi
  fi
  ok "$name $(version_of "$command") is installed."
}

# offer_login NAME LOGGED_IN HOW HINT COMMAND...: asks whether to log NAME in,
# or if it's logged in already (LOGGED_IN is yes), to log in again, then says
# HOW it logs in and runs COMMAND, its login command, with log_in.
offer_login() {
  local name=$1 logged_in=$2 how=$3 hint=$4
  shift 4
  if [[ $logged_in == yes ]]; then
    confirm "$name is logged in. Log in again?" no || return 0
  elif ! confirm "Log $name in now?" yes; then
    ok "$name isn't logged in. To log in later: $hint"
    return 0
  fi
  info "$how"
  log_in "$hint" "$@"
}

# log_in HINT COMMAND...: runs COMMAND, which logs something in, at the
# terminal. Ctrl-C stops just COMMAND. If it fails, says to run HINT later,
# and carries on.
log_in() {
  local hint=$1 status=0
  shift
  trap : INT
  # BROWSER=false keeps it from opening the link in a text browser on the
  # server, if there is one.
  BROWSER=false at_terminal "$@" || status=$?
  trap - INT
  if ((status != 0)); then
    warn "That didn't log in, as it says above. To try again later: $hint"
  fi
}

# version_of COMMAND: prints the version COMMAND --version shows.
version_of() {
  "$1" --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+' | head -n 1 || true
}
