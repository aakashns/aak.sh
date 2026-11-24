# cleanup.sh: keeps the server from running out of CPU, memory or disk. A
# systemd timer of your user's runs rembox's cleanup every day at 4 AM, your
# Mac's time: it removes opentunnel's routes, stops dev servers, Playwright's
# browsers and containers, and prunes caches. The rest clean up after
# themselves, as setup sets them to: T3 Code deletes old worktrees and logs
# (see t3_settings), apt its downloads and unused packages (see
# setup_auto_upgrades), and journald keeps its logs under JOURNAL_MAX.

CLEANUP_SCRIPT=.config/rembox/cleanup.sh # in your home folder
CLEANUP_UNITS=.config/systemd/user       # in your home folder: rembox-cleanup.service and .timer
CLEANUP_TIME=04:00

JOURNAL_CONF=/etc/systemd/journald.conf.d/50-rembox.conf
JOURNAL_MAX=500M

# limit_journal: keeps the system journal under JOURNAL_MAX, instead of
# journald's default of a tenth of the disk, up to 4 GiB. Runs as root.
limit_journal() {
  step "Keep the system journal under $JOURNAL_MAX"
  local content
  content=$(
    echo "# Written by rembox setup."
    echo "[Journal]"
    echo "SystemMaxUse=$JOURNAL_MAX"
  )
  if ! same "$JOURNAL_CONF" "$content"; then
    [[ -d ${JOURNAL_CONF%/*} ]] || run mkdir -p "${JOURNAL_CONF%/*}"
    put "$JOURNAL_CONF" 644 "$content"
    run systemctl restart systemd-journald
  fi
  ok "The system journal keeps up to $JOURNAL_MAX of logs."
}

# setup_cleanup TIMEZONE: writes rembox's cleanup and the systemd units that
# run it every day at CLEANUP_TIME in TIMEZONE, your Mac's, like Asia/Kolkata,
# or the server's, if it's empty or systemd doesn't know it. Runs as your user,
# whose services keep running when you aren't logged in (see enable_linger).
setup_cleanup() {
  step "Clean up the server every day at 4 AM"
  ((EUID != 0)) || fail "Run this as your user, not root."
  local tz=$1 when="*-*-* $CLEANUP_TIME:00" units=$HOME/$CLEANUP_UNITS changed=no content
  if [[ -n $tz ]] && systemd-analyze calendar "$when $tz" &>/dev/null; then
    when+=" $tz"
  else
    tz=$(timedatectl show --property=Timezone --value 2>/dev/null || echo "the server's time zone")
  fi

  content=$(cleanup_script)
  if ! same "$HOME/$CLEANUP_SCRIPT" "$content"; then
    [[ -d $HOME/${CLEANUP_SCRIPT%/*} ]] || run mkdir -p "$HOME/${CLEANUP_SCRIPT%/*}"
    put "$HOME/$CLEANUP_SCRIPT" 755 "$content" bash -n
  fi
  [[ -d $units ]] || run mkdir -p "$units"
  content=$(
    echo "# Written by rembox setup, which rewrites it."
    echo "[Unit]"
    echo "Description=rembox's daily cleanup of tunnels, dev servers, containers and caches"
    echo
    echo "[Service]"
    echo "Type=oneshot"
    echo "ExecStart=/bin/bash %h/$CLEANUP_SCRIPT"
  )
  if ! same "$units/rembox-cleanup.service" "$content"; then
    put "$units/rembox-cleanup.service" 644 "$content"
    changed=yes
  fi
  # Persistent: if the server was off at CLEANUP_TIME, it runs once it's on.
  content=$(
    echo "# Written by rembox setup, which rewrites it."
    echo "[Unit]"
    echo "Description=Run rembox's cleanup every day"
    echo
    echo "[Timer]"
    echo "OnCalendar=$when"
    echo "Persistent=true"
    echo
    echo "[Install]"
    echo "WantedBy=timers.target"
  )
  if ! same "$units/rembox-cleanup.timer" "$content"; then
    put "$units/rembox-cleanup.timer" 644 "$content"
    changed=yes
  fi
  if [[ $changed == yes ]] || ! systemctl --user is-enabled --quiet rembox-cleanup.timer ||
    ! systemctl --user is-active --quiet rembox-cleanup.timer; then
    if ! { run systemctl --user daemon-reload && run systemctl --user enable rembox-cleanup.timer &&
      run systemctl --user restart rembox-cleanup.timer; }; then
      warn "systemd couldn't start the cleanup's timer, as it says above. Run rembox setup again later."
      checklist warn "No daily cleanup"
      return
    fi
  fi
  ok "Every day at 4 AM ($tz), rembox removes opentunnel's routes, stops dev servers, Playwright's browsers and containers, and prunes caches. To run it now: systemctl --user start rembox-cleanup"
  checklist ok "Cleans up daily at 4 AM ($tz)"
}

# cleanup_script: prints rembox's cleanup, a script of the cleanup_ functions
# below, which run on their own, without lib.sh. Their output goes to the
# journal: journalctl --user -u rembox-cleanup
cleanup_script() {
  echo '#!/bin/bash'
  echo "# rembox's daily cleanup. Written by rembox setup, which rewrites it."
  echo '# rembox-cleanup.timer runs it. To run it now: systemctl --user start rembox-cleanup'
  echo 'set -uo pipefail'
  declare -f cleanup_all cleanup_routes cleanup_dev_servers cleanup_dev_server_pids \
    cleanup_playwright_pids cleanup_stop cleanup_containers cleanup_caches
  # shellcheck disable=SC2016 # "$@" is the script's
  echo 'cleanup_all "$@"'
}

# cleanup_all: runs each part of the cleanup, carrying on if one fails, and
# fails if any did, saying which.
cleanup_all() {
  local part status=0
  for part in cleanup_routes cleanup_containers cleanup_dev_servers cleanup_caches; do
    if ! "$part"; then
      echo "$part failed" >&2
      status=1
    fi
  done
  return "$status"
}

# cleanup_routes: removes every opentunnel route, so no dev server stays public.
# The tunnel stays connected, for the next route. `opentunnel route list` shows
# each as "NAME.TUNNEL.opentunnel.xyz  →  TARGET".
cleanup_routes() {
  local bin=$HOME/.local/bin/opentunnel routes name status=0
  [[ -x $bin ]] || return 0
  routes=$("$bin" route list) || return 1
  while read -r name; do
    "$bin" route remove "$name" || status=1
  done < <(awk '$2 == "→" { sub(/\..*/, "", $1); print $1 }' <<<"$routes")
  return "$status"
}

# cleanup_dev_servers: stops the dev servers you or your agents left running,
# and Playwright's browsers, saying which by ID and name only, as a command
# line can hold a secret. A program that restarts its server when it stops
# gets 3 tries; it fails if any is still running after them.
cleanup_dev_servers() {
  local pids
  for _ in 1 2 3; do
    mapfile -t pids < <({ cleanup_dev_server_pids; cleanup_playwright_pids; } | sort -un)
    ((${#pids[@]} > 0)) || return 0
    ps -o pid=,comm= -p "${pids[*]}" | sed 's/^ */Stopping /'
    cleanup_stop "${pids[@]}"
  done
  mapfile -t pids < <({ cleanup_dev_server_pids; cleanup_playwright_pids; } | sort -un)
  ((${#pids[@]} == 0))
}

# cleanup_dev_server_pids: prints the IDs of your dev servers: processes
# listening on a TCP port that run Node, bun, Deno, Python, Ruby or PHP, or a
# program built by go run or cargo. Others, like ssh -L or a database, stay,
# as do programs systemd runs as a service, like T3 Code's and opentunnel's,
# and T3 Code's own tools, in ~/.t3. Dev servers run in a session's scope, or
# an agent's, which T3 Code puts in one of its own.
cleanup_dev_server_pids() {
  local pid cgroup exe
  for pid in $(ss -Htlnp 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -un); do
    cgroup=$(cut -d: -f3- "/proc/$pid/cgroup" 2>/dev/null) || continue
    exe=$(readlink "/proc/$pid/exe" 2>/dev/null) || continue
    [[ $cgroup != *.service && $exe != "$HOME/.t3/"* ]] || continue
    if [[ ${exe##*/} =~ ^(node|bun|deno|python[0-9.]*|ruby[0-9.]*|php[0-9.]*)$ ||
      $exe == /tmp/go-build*/exe/* || $exe == */target/debug/* || $exe == */target/release/* ]]; then
      echo "$pid"
    fi
  done
}

# cleanup_playwright_pids: prints the IDs of the browsers Playwright runs, from
# ~/.cache/ms-playwright, which tests can leave running.
cleanup_playwright_pids() {
  local pid exe
  for pid in $(pgrep -u "$(id -u)"); do
    exe=$(readlink "/proc/$pid/exe" 2>/dev/null) || continue
    [[ $exe != "$HOME/.cache/ms-playwright/"* ]] || echo "$pid"
  done
}

# cleanup_stop PID...: asks the processes to stop, then, after 10 seconds,
# kills the ones still running.
cleanup_stop() {
  local pid running=("$@")
  kill -TERM "$@" 2>/dev/null
  for _ in {1..10}; do
    sleep 1
    running=()
    for pid; do
      ! kill -0 "$pid" 2>/dev/null || running+=("$pid")
    done
    ((${#running[@]} > 0)) || return 0
  done
  kill -KILL "${running[@]}" 2>/dev/null
  return 0
}

# cleanup_containers: stops your Podman containers, then removes images no tag
# points to. Stopped containers stay, with what they hold, so podman start
# starts them again, as do volumes and tagged images.
cleanup_containers() {
  command -v podman >/dev/null || return 0
  podman stop --all --time 10 && podman image prune --force
}

# cleanup_caches: removes what uv's cache holds that nothing uses.
cleanup_caches() {
  [[ ! -x $HOME/.local/bin/uv ]] || "$HOME/.local/bin/uv" cache prune
}
