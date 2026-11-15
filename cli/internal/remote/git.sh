# git.sh: installs gh from GitHub's apt repo, logs gh in to GitHub, for git
# too, and sets your name and email for git, from GitHub if it can.

GH_KEYRING=/etc/apt/keyrings/githubcli-archive-keyring.gpg
GH_SOURCES=/etc/apt/sources.list.d/github-cli.list # where GitHub's docs put it

# add_gh_repo: has apt install gh from GitHub's apt repo, as the distros' gh
# lags far behind (2.23 on Debian 12). It goes before update, which then
# upgrades a gh from the distro, and install_basics installs gh from it.
add_gh_repo() {
  step "Install gh from GitHub's apt repo, which has its latest version"
  local dir changed=no content
  dir=$(mktemp -d)
  # The key may change, so it's downloaded again each time.
  if ! run curl -fsSL -o "$dir/key.gpg" https://cli.github.com/packages/githubcli-archive-keyring.gpg; then
    rm -rf "$dir"
    warn "Couldn't download the key for GitHub's apt repo, so gh comes from the distro, or stays as it is. Run rembox setup again later."
    return
  fi
  if ! cmp -s "$dir/key.gpg" "$GH_KEYRING"; then
    [[ -d ${GH_KEYRING%/*} ]] || run install -d -m 755 "${GH_KEYRING%/*}"
    run install -m 644 "$dir/key.gpg" "$GH_KEYRING"
    changed=yes
  fi
  rm -rf "$dir"
  content="deb [arch=$(dpkg --print-architecture) signed-by=$GH_KEYRING] https://cli.github.com/packages stable main"
  if ! same "$GH_SOURCES" "$content"; then
    put "$GH_SOURCES" 644 "$content"
    changed=yes
  fi
  if [[ $changed == yes ]]; then
    ok "apt installs gh from GitHub's apt repo, and update upgrades it."
  else
    ok "apt installs gh from GitHub's apt repo already."
  fi
}

# setup_git MAC_NAME MAC_EMAIL: sets the name and email git puts on your
# commits, unless git has them already. If gh is logged in, they come from your
# GitHub profile: its name, and its public email, or else GitHub's noreply
# address for you, which links commits to you without showing your email.
# Otherwise, they're MAC_NAME and MAC_EMAIL, from git on your Mac, which may be
# empty. The name is your GitHub login, if there's no other. Runs as your user,
# after setup_github.
setup_git() {
  step "Set your name and email for git commits"
  ((EUID != 0)) || fail "Run this as your user, not root."
  local name email gh_name='' gh_email='' login='' id='' profile
  name=$(git config --global --get user.name || true)
  email=$(git config --global --get user.email || true)
  if [[ -z $name || -z $email ]] && gh auth status --hostname github.com &>/dev/null &&
    profile=$(gh api user --jq '.name // "", .email // "", .login, .id'); then
    { IFS= read -r gh_name; IFS= read -r gh_email; IFS= read -r login; IFS= read -r id; } <<<"$profile"
    [[ -n $gh_email ]] || gh_email="$id+$login@users.noreply.github.com"
  fi
  if [[ -z $name ]]; then
    name=${gh_name:-${1:-$login}}
    [[ -z $name ]] || run git config --global user.name "$name"
  fi
  if [[ -z $email ]]; then
    email=${gh_email:-$2}
    [[ -z $email ]] || run git config --global user.email "$email"
  fi
  if [[ -z $name || -z $email ]]; then
    warn "git has no name or email for your commits. To set them: git config --global user.name 'Your Name', and user.email you@example.com"
  else
    ok "git puts $name <$email> on your commits. To change them: git config --global user.name or user.email"
  fi
}

# setup_github: logs gh in to GitHub, if you want to and it isn't yet, with a
# code you enter on any device, and has git use gh's login for github.com.
# Runs as your user.
setup_github() {
  step "Log in to GitHub with gh"
  ((EUID != 0)) || fail "Run this as your user, not root."
  if ! gh auth status --hostname github.com &>/dev/null; then
    info "gh logs in with a code: open the link it shows on any device, and enter the code. Coding agents running as you can use this login too."
    if ! confirm "Log in to GitHub now?" yes; then
      ok "gh isn't logged in. To log in later: gh auth login, then gh auth setup-git"
      return
    fi
    # gh shows a code and a link. BROWSER=false keeps it from opening the
    # link in a text browser on the server, like w3m, if there is one.
    if ! BROWSER=false at_terminal gh auth login --hostname github.com --git-protocol https --web; then
      warn "gh couldn't log in, as it says above. To try again: gh auth login, then gh auth setup-git"
      return
    fi
  fi
  if [[ $(git config --global --get-all credential.https://github.com.helper || true) != *'gh auth git-credential'* ]]; then
    run gh auth setup-git --hostname github.com
  fi
  ok "gh is logged in to GitHub as $(gh api user --jq .login 2>/dev/null || echo 'you'), and git uses its login for github.com."
}
