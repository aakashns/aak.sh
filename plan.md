# rembox plan

What `rembox setup` does so far, and what comes next. Keep this current in every PR. To pick up
where the last agent left off, start at the first unchecked item under **Next**.

The original hand-run version of the whole setup is in `~/workspace/scratch/devbox-setup/`:
`setup.sh` (one script run as root on the server), `SETUP.md` (what it does, plus design notes
and gotchas), and `SETUP-MANUAL.md` (the step-by-step log, dead ends included). Port from there,
but follow this repo's conventions (AGENTS.md, and the style of `cli/internal/remote/*.sh`).

## Done

- [x] Upgrade every package, and turn on daily security updates (unattended-upgrades)
- [x] Add your user, with sudo that asks for its password and root's SSH keys. The server asks
      for its name just before adding it; `userWriter` in `setup.go` reads it back.
- [x] Each session says it has logged in, and why it needs sudo before sudo asks (`as_root`).
- [x] The CLI says when it connects and reconnects, before ssh asks for a passphrase.
- [x] `rembox setup NAME` asks for the name too, and renames the server if it changes.
- [x] Tab completes the key's path; the default key is the first of id_ecdsa, id_ed25519, id_rsa.
- [x] Before moving ssh's port, asks if a firewall outside the server needs it opened, and stops if it isn't.
- [x] `rembox delete NAME` removes a server from rembox. Setup ends by listing the commands for it.
- [x] Before those commands, a checklist of what setup did, skipped or couldn't do; steps add to
      its lines with `checklist` (`lib.sh`), which rembox reads from hidden markers.
- [x] The server's name is its hostname (`hostname.sh`), and the prompt shows it in full: `user@devbox.example.com`.
- [x] Move ssh to the port you give (a random one by default), with keys only and no root login; fail2ban
- [x] ufw: block every incoming connection but ssh
- [x] Docker publishes ports on 127.0.0.1 unless told otherwise (`/etc/docker/daemon.json`),
      since its ports get past ufw.
- [x] Restart the server, if an update needs it
- [x] Base dev packages (`BASIC_PACKAGES` in `update.sh`): build-essential, git, gh, curl, wget,
      zip, unzip, jq, ripgrep, fd-find (plus an `fd` link to `fdfind`), htop, zsh, nano,
      man-db, dnsutils, ufw, qrencode. fzf, zoxide and Zellij come from their latest GitHub releases
      (`install_release`), as apt's are old or missing. These install in `start`, as `home`
      needs zsh and git.
- [x] Swap file as big as memory, up to 4 GiB, unless there's swap already; swappiness 10
      (`swap.sh`). Skipped in containers.
- [x] Generate the locales your Mac sends over ssh (LANG, LC_*), so programs don't warn
      (`locale.sh`). The CLI works them out from its environment and passes them to
      `setup.sh home`, for `finish`. Not on the site, since it's a small thing.
- [x] zsh as your login shell (`zsh.sh`), based on section 6 of
      https://swiftace.org/posts/remote-development-environment-setup: zinit with
      zsh-syntax-highlighting, zsh-completions, zsh-autosuggestions and OMZ's git aliases
      (`OMZL::git.zsh` + `OMZP::git`; zinit's own aliases are off, so `zi` is zoxide's); fzf's
      `fzf --zsh`; zoxide's `z`; the article's history and completion settings. No
      Powerlevel10k: a hand-rolled prompt (host, folder, git branch, with `*` and `⇡N⇣N` from a
      `git status` run in the background with `zle -F`), so no wizard or Nerd Font. TERM falls back
      to xterm-256color only if the server has no terminfo for yours (like Ghostty's).
  - **Shell config:** rembox owns `~/.config/rembox/{zshenv,zprofile,zshrc}`, which `~/.zshenv`,
    `~/.zprofile` and `~/.zshrc` source from a line at their top, added once; your own settings go
    below it, as do the toolchain installers'. Re-runs rewrite only rembox's files. zshenv sets
    `skip_global_compinit` (Debian and Ubuntu's /etc/zsh/zshrc runs compinit too early) and adds
    Go to PATH; zprofile sources `~/.profile` (for `~/.local/bin`).
  - **Running as your user:** a second ssh session, `setup.sh home`, as your user on the new port,
    without sudo, after `start`. It then carries on as root with `finish`, through `as_root`, so
    ssh logs in once after `start` (finish may restart the server, so it stays last).
    It's a real login (PAM, systemd user bus) at a terminal (`ssh -t`), for device-code logins.
    Later user steps (git/gh, toolchains, agents) go in it. `add_user` makes zsh the login shell,
    so `home` runs in zsh, and installers set up zsh's files.
  - zinit and its plugins download during `home` (`zsh -i -c exit`), unless they're there.
    Re-runs don't update them; `zinit update` does.
  - Zellij instead of tmux: ssh logins attach to the session `main` (top of rembox's zshrc).
  - Later, maybe: Neovim + LazyVim (section 8).
- [x] Git and GitHub (`git.sh`): gh from GitHub's apt repo. In `home`: `gh auth login` (device
      code) and `gh auth setup-git`, then git's name and email, unless set, from GitHub (public
      email, else noreply; profile name, else login), else this Mac's, without asking.
- [x] Toolchains (`toolchains.sh`), no questions: the latest Go in `/usr/local/go` (in `start`);
      in `home`, each with its own installer and defaults: bun, Node via Vite+, Python via uv,
      Rust via rustup. Re-runs ask before upgrading. gcc comes with build-essential.

- [x] Coding agents (`agents.sh`), in `home`: asks about each of Claude Code, Codex, OpenCode
      and Pi; runs its own install script (with `setsid`, so it takes its defaults) and its own
      login command (`claude auth login`, or `--console` for API billing; `codex login
      --device-auth`, or `--with-api-key`; `opencode auth login`; Pi logs in from inside, with
      `/login`). Re-runs don't upgrade them; they offer to log in again.
- [x] T3 Code (`t3.sh`): linger for your user (in `start`); in `home`, installs `t3`, sets
      `~/.t3/userdata/settings.json` to add projects in `~/work` and turn on Pi and OpenCode (off
      by default), runs `t3 up --connect --no-lan` (sign-in with a code; installs the service),
      then shows a QR code for https://t3.codes/mobile. T3 reads PATH from your login shell, so it
      finds the agents without a PATH drop-in.
- [x] Site: a terminal that plays `rembox setup` (`site.js`), and collapsible FAQs in place of
      the install, upgrade and verify sections.
- [x] Site SEO: link preview image, favicons, sitemap, and structured data (`site/images/render.sh`).

## Next

1. [ ] **Shared agent instructions:** a `~/.config/rembox/AGENTS.md`, symlinked to
   `~/.codex/AGENTS.md`, `~/.claude/CLAUDE.md` and `~/.pi/agent/AGENTS.md`; never overwrite real
   files.
2. [ ] Later, maybe: `t3 service protect` (asks for sudo), and T3 Connect's device approval, once
   `t3` has a command for it.

## Testing on real machines

See **Development** in README.md: `scripts/e2e.sh` runs `rembox setup` twice on a fresh OrbStack
machine. Run it on `debian:bookworm` too for changes to the server scripts.
To try a login without a terminal, run `ssh -t` in a tmux session on this Mac
(`tmux new-session -d 'ssh -t …'`), then `tmux send-keys` and `tmux capture-pane -p`.
