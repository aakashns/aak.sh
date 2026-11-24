# cleanup.sh: schedule independent system and developer maintenance. The user
# timer runs under the lingering user manager, with gh and rootless Podman in
# the same environment as the developer's other services.
setup_cleanup() {
  local scope=$1 units=/etc/systemd/system dir=/usr/local/lib/rembox
  local ctl=(systemctl) file content changed=no
  if [[ $scope == user ]]; then
    units=$HOME/.config/systemd/user
    dir=$HOME/.local/lib/rembox
    ctl+=(--user)
  fi
  step "Schedule daily $scope cleanup"
  run mkdir -p "$units" "$dir"
  file=$dir/cleanup
  content=$("cleanup_${scope}_program")
  same "$file" "$content" || put "$file" 755 "$content"
  local executable=$dir/cleanup
  [[ $scope != user ]] || executable=%h/.local/lib/rembox/cleanup
  file=$units/rembox-cleanup.service
  content="[Unit]
Description=Daily rembox $scope cleanup

[Service]
Type=oneshot
Nice=10
IOSchedulingClass=idle
ExecStart=$executable"
  if ! same "$file" "$content"; then
    put "$file" 644 "$content"
    changed=yes
  fi
  file=$units/rembox-cleanup.timer
  content="[Unit]
Description=Run rembox $scope cleanup daily

[Timer]
OnCalendar=*-*-* 04:00:00
Persistent=true

[Install]
WantedBy=timers.target"
  if ! same "$file" "$content"; then
    put "$file" 644 "$content"
    changed=yes
  fi
  [[ $changed == no ]] || run "${ctl[@]}" daemon-reload
  if ! "${ctl[@]}" is-enabled --quiet rembox-cleanup.timer || ! "${ctl[@]}" is-active --quiet rembox-cleanup.timer; then
    run "${ctl[@]}" enable --now rembox-cleanup.timer
  fi
  checklist ok "Daily $scope cleanup at 04:00"
}

cleanup_system_program() {
  cat <<'SCRIPT'
#!/bin/bash
set -u
failed=0
podman --remote=false stop --all || failed=1
podman --remote=false image prune --force --filter until=168h || failed=1
# Only talk to the local Docker daemon if it is already running.
if systemctl is-active --quiet docker.service; then
  docker=(docker --host unix:///var/run/docker.sock)
  if ids=$("${docker[@]}" ps -q); then
    if [[ -n $ids ]]; then
      while read -r container; do
        "${docker[@]}" stop "$container" || failed=1
      done <<<"$ids"
    fi
  else
    failed=1
  fi
fi
export DEBIAN_FRONTEND=noninteractive
apt-get -y -o DPkg::Lock::Timeout=300 autoremove || failed=1
apt-get clean || failed=1
journalctl --rotate --vacuum-size=200M || failed=1
exit "$failed"
SCRIPT
}

cleanup_user_program() {
  cat <<'SCRIPT'
#!/usr/bin/python3
import json
import os
from pathlib import Path
import re
import select
import signal
import subprocess
import sys
import time

WORK = Path.home() / "work"
TUNNEL = Path.home() / ".local/bin/opentunnel"
failed = False


def attempt(label, action, *args):
    global failed
    try:
        return action(*args)
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        # Commands can contain credential-bearing remote URLs. Log only the
        # operation and error type, and keep independent cleanup tasks running.
        print(f"{label} failed ({type(error).__name__})", file=sys.stderr)
        failed = True


def output(*args, cwd=None):
    return os.fsdecode(subprocess.check_output(args, cwd=cwd, stderr=subprocess.DEVNULL,
                                               timeout=90))


def remove_routes(cli):
    routes = output(*cli, "route", "list").splitlines()
    status = output(*cli, "status")
    hostname = re.search(r"^Hostname: (\S+)$", status, re.M)
    for line in routes:
        if line == "No routes configured.":
            continue
        name, _, target = line.partition("→")
        if not target:
            raise ValueError("unknown route listing")
        name = name.strip()
        if hostname:
            host = hostname[1]
            name = "@" if name == host else name.removesuffix("." + host)
        attempt("Remove preview route", output, *cli, "route", "remove", name)


def close_profile(profile):
    cli = [TUNNEL, "--profile", profile]
    attempt("List preview routes", remove_routes, cli)
    output(*cli, "down")


def close_tunnels():
    if not TUNNEL.is_file():
        return
    data = Path(os.getenv("XDG_DATA_HOME", Path.home() / ".local/share")) / "opentunnel"
    config = Path(os.getenv("XDG_CONFIG_HOME", Path.home() / ".config")) / "opentunnel"
    profiles = {p.stem for p in config.glob("*.toml")}
    profiles.update(p.name for p in data.glob("*") if p.is_dir())
    for profile in profiles | {"default"}:
        attempt("Disconnect opentunnel profile", close_profile, profile)


def worktrees(repo):
    listing = output("git", "worktree", "list", "--porcelain", "-z", cwd=repo)
    for record in listing.rstrip("\0").split("\0\0"):
        tree = {}
        for field in record.split("\0"):
            name, _, value = field.partition(" ")
            tree[name] = value
        yield tree


PR_QUERY = """query($owner:String!, $repo:String!, $ref:String!, $name:String!) {
  repository(owner:$owner, name:$repo) {
    pullRequests(first:1, states:[OPEN], baseRefName:$name) { totalCount }
    ref(qualifiedName:$ref) { associatedPullRequests(first:1, states:[OPEN]) { totalCount } }
  }
}"""


def has_open_pr(path, branch):
    # Query each fetch/push destination and the tracked branch, which may
    # have a different name. Ref associations also include PRs from forks.
    remotes = output("git", "remote", cwd=path).splitlines()
    if not remotes:
        return True
    upstream = output("git", "for-each-ref", "--format=%(upstream:remoteref)", branch,
                      cwd=path).strip()
    destinations = set()
    for remote in remotes:
        for options in ([], ["--push"]):
            for url in output("git", "remote", "get-url", "--all", *options, remote,
                              cwd=path).splitlines():
                match = re.fullmatch(r"(?:https://github\.com/|(?:ssh://git@github\.com/|git@github\.com:))"
                                     r"([\w.-]+)/([\w.-]+)", url.removesuffix(".git"))
                if not match:
                    return True
                destinations.add(match.groups())
    for owner, repo in destinations:
        for ref in {branch, upstream} - {""}:
            response = json.loads(output("gh", "api", "--hostname", "github.com", "graphql",
                                         "-f", "query=" + PR_QUERY, "-f", "owner=" + owner,
                                         "-f", "repo=" + repo, "-f", "ref=" + ref,
                                         "-f", "name=" + ref.removeprefix("refs/heads/")))
            repository = response["data"]["repository"]
            if response.get("errors") or not repository:
                raise ValueError("incomplete GitHub result")
            if repository["pullRequests"]["totalCount"] != 0:
                return True
            remote_ref = repository["ref"]
            if remote_ref is not None and remote_ref["associatedPullRequests"]["totalCount"] != 0:
                return True
    return not destinations


def stale(path, branch, head):
    if output("git", "symbolic-ref", "HEAD", cwd=path).strip() != branch:
        return False
    if output("git", "rev-parse", "HEAD", cwd=path).strip() != head:
        return False
    cutoff = time.time() - 48 * 3600
    gitdir = Path(output("git", "rev-parse", "--absolute-git-dir", cwd=path).rstrip("\n"))
    if max((gitdir / "HEAD").stat().st_mtime, (path / ".git").stat().st_mtime,
           int(output("git", "show", "-s", "--format=%ct", "HEAD", cwd=path))) > cutoff:
        return False
    reflog = gitdir / "logs/HEAD"
    if reflog.exists() and reflog.stat().st_mtime > cutoff:
        return False
    # Git will remove ignored files too, including .env files. Only discard
    # ignored directories known to hold reproducible dependency/build caches.
    changes = output("git", "status", "--porcelain=v1", "-z", "--untracked-files=normal",
                     "--ignored=matching", "--ignore-submodules=none", cwd=path)
    caches = {"node_modules", "__pycache__", ".next", ".vite", ".pytest_cache"}
    return all(entry.startswith("!! ") and entry.endswith("/") and
               Path(entry[3:]).name in caches for entry in changes.split("\0") if entry)


def prune_tree(repo, tree):
    path = Path(tree["worktree"])
    branch = tree.get("branch")
    if not branch or "locked" in tree or "prunable" in tree or not path.is_dir():
        return
    if stale(path, branch, tree["HEAD"]) and not has_open_pr(path, branch):
        # A commit, checkout or edit during the network request cancels removal.
        if stale(path, branch, tree["HEAD"]):
            output("git", "worktree", "remove", "--", path, cwd=repo)
            print(f"Removed stale worktree {path}")


def is_dev_server(argv, cwd, roots, executable):
    names = [Path(arg).name for arg in argv[:4]]
    servers = {"vite", "vite.js", "next-server", "webpack-dev-server", "live-server",
               "http-server", "astro", "uvicorn", "flask", "gunicorn", "workerd"}
    if any(name in servers or name.startswith("next-server (") for name in names):
        return True
    if "next" in names and "dev" in argv[:5]:
        return True
    if ("-m", "http.server") in zip(argv, argv[1:]) or ("-m", "uvicorn") in zip(argv, argv[1:]):
        return True
    if names[0] == "php" and "-S" in argv or "rails" in names and "server" in argv:
        return True
    if any(part.startswith("go-build") for part in executable.parts) and "exe" in executable.parts:
        return True
    if any(root in executable.parents for root in roots):
        return True
    if "manage.py" in names and "runserver" in argv:
        return True
    # A project-local script or binary can serve directly without a framework.
    # Restrict interpreters to their entry point (an arbitrary argument might
    # just name a project, e.g. a coding agent or language server).
    program = Path(argv[0])
    if program.name in {"node", "bun", "deno", "python", "python3", "ruby", "php"}:
        if len(argv) < 2 or argv[1].startswith("-"):
            return False
        program = Path(argv[1])
    elif "/" not in argv[0]:
        return False
    program = (cwd / program).resolve()
    return program.is_file() and any(root in program.parents for root in roots)


def stop_server(pid, roots):
    proc = Path("/proc") / str(pid)
    try:
        fd = os.pidfd_open(pid)
        try:
            cwd = (proc / "cwd").resolve(strict=True)
            if proc.stat().st_uid != os.getuid() or not any(
                    root in cwd.parents or root == cwd for root in roots):
                return
            argv = os.fsdecode((proc / "cmdline").read_bytes()).rstrip("\0").split("\0")
            if is_dev_server(argv, cwd, roots, (proc / "exe").resolve(strict=True)):
                signal.pidfd_send_signal(fd, signal.SIGTERM)
                poll = select.poll()
                poll.register(fd, select.POLLIN)
                if not poll.poll(5000):
                    signal.pidfd_send_signal(fd, signal.SIGKILL)
                print(f"Stopped project listener {pid}")
        finally:
            os.close(fd)
    except (FileNotFoundError, PermissionError, ProcessLookupError):
        pass


def stop_servers(roots):
    # A pidfd pins process identity before checking cwd and sending signals.
    listeners = output("ss", "-H", "-ltnp")
    for pid in set(map(int, re.findall(r"\bpid=(\d+)", listeners))):
        attempt(f"Stop project listener {pid}", stop_server, pid, roots)


def repositories():
    # Projects can be grouped into subdirectories of ~/work. Stop descending
    # at each checkout to avoid scanning dependency and build trees.
    for directory, dirs, files in os.walk(WORK):
        if ".git" in dirs or ".git" in files:
            dirs.clear()
            yield Path(directory)


def main():
    if os.geteuid() == 0:
        sys.exit("Developer cleanup must run as the developer")
    attempt("Preview tunnels", close_tunnels)
    attempt("Rootless containers", output, "podman", "--remote=false", "stop", "--all")
    attempt("Dangling Podman images", output, "podman", "--remote=false", "image", "prune",
            "--force", "--filter", "until=168h")
    socket = Path(os.environ["XDG_RUNTIME_DIR"]) / "docker.sock"
    if socket.is_socket():
        docker = ["docker", "--host", "unix://" + str(socket)]
        ids = attempt("List rootless Docker containers", output, *docker, "ps", "-q")
        for ident in (ids or "").splitlines():
            attempt("Stop rootless Docker container", output, *docker, "stop", ident)
    roots = {WORK}
    candidates = {}
    for repo in repositories():
        trees = attempt(f"List worktrees for {repo}", lambda: list(worktrees(repo)))
        if trees:
            # Git lists the primary checkout first, even from a linked checkout.
            primary = Path(trees[0]["worktree"])
            for tree in trees[1:]:
                path = Path(tree["worktree"])
                roots.add(path)
                candidates[path] = (primary, tree)
    attempt("Project dev servers", stop_servers, roots)
    for path, (repo, tree) in candidates.items():
        attempt(f"Check worktree {path}", prune_tree, repo, tree)
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())
SCRIPT
}
