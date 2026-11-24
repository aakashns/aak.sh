"""Exercise the installed cleanup program against disposable Git repos and listeners."""
import contextlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import types
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
program = subprocess.check_output(["bash", "-c", "source cleanup.sh; cleanup_user_program"], cwd=HERE)
cleanup = types.ModuleType("cleanup")
exec(compile(program, "rembox-cleanup", "exec"), cleanup.__dict__)


class SystemCleanupTest(unittest.TestCase):
    def test_independent_jobs_run_after_a_failure(self):
        program = subprocess.check_output(["bash", "-c", "source cleanup.sh; cleanup_system_program"],
                                          cwd=HERE)
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            for command in ("podman", "systemctl", "docker", "apt-get", "journalctl"):
                stub = directory / command
                stub.write_text('#!/bin/sh\necho "${0##*/} $*" >> "$TEST_LOG"\n'
                                'case "${0##*/} $*" in "podman "*) exit 1;; '
                                '"docker "*ps*) echo abc;; esac\n')
                stub.chmod(0o755)
            log = directory / "calls"
            result = subprocess.run(["bash"], input=program, env=dict(
                os.environ, PATH=temp + ":" + os.environ["PATH"], TEST_LOG=str(log)))
            self.assertEqual(result.returncode, 1)
            calls = log.read_text().splitlines()
            self.assertIn("podman --remote=false image prune --force --filter until=168h", calls)
            self.assertIn("docker --host unix:///var/run/docker.sock stop abc", calls)
            self.assertIn("apt-get -y -o DPkg::Lock::Timeout=300 autoremove", calls)
            self.assertIn("apt-get clean", calls)
            self.assertIn("journalctl --rotate --vacuum-size=200M", calls)


class CleanupTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name).resolve()
        self.repo = self.root / "work/group/project"
        self.repo.mkdir(parents=True)
        self.git("init", "-q", "-b", "main")
        self.git("config", "user.name", "Fixture")
        self.git("config", "user.email", "fixture@example.test")
        (self.repo / ".gitignore").write_text("node_modules/\n.env\n")
        self.git("add", ".gitignore")
        self.git("commit", "-qm", "Initial", env=dict(os.environ, GIT_COMMITTER_DATE="2001-01-01T00:00Z"))
        self.git("remote", "add", "origin", "git@github.com:fixture/project.git")
        self.tree = self.root / "linked tree"
        self.git("worktree", "add", "-qb", "topic", self.tree)
        self.record = list(cleanup.worktrees(self.repo))[1]
        self.old = time.time() - 49 * 3600

    def git(self, *args, cwd=None, env=None):
        return subprocess.check_output(["git", *args], cwd=cwd or self.repo, env=env).decode().strip()

    def age(self):
        gitdir = Path(self.git("rev-parse", "--absolute-git-dir", cwd=self.tree))
        for path in (gitdir / "HEAD", gitdir / "logs/HEAD", self.tree / ".git"):
            os.utime(path, (self.old, self.old))

    def prune(self):
        cleanup.prune_tree(self.repo, self.record)

    def test_worktree_removal_uses_git_and_preserves_branch(self):
        self.age()
        cache = self.tree / "node_modules"
        cache.mkdir()
        (cache / "dep").touch()
        with patch.object(cleanup, "has_open_pr", return_value=False):
            self.prune()
        self.assertFalse(self.tree.exists())
        self.assertEqual(self.git("rev-parse", "topic"), self.record["HEAD"])
        self.assertEqual(len(list(cleanup.worktrees(self.repo))), 1)

    def test_keep_new_dirty_ignored_locked_detached_and_recent_commit(self):
        with patch.object(cleanup, "has_open_pr") as check:
            self.prune()  # recently created, even though HEAD is old
            self.age()
            for name in (".env", "new-file"):
                (self.tree / name).touch()
                self.prune()
                (self.tree / name).unlink()
            for field in ("locked", "detached"):
                record = dict(self.record, **{field: ""})
                if field == "detached":
                    del record["branch"]
                cleanup.prune_tree(self.repo, record)
            self.git("commit", "--allow-empty", "-qm", "Today", cwd=self.tree)
            self.record = list(cleanup.worktrees(self.repo))[1]
            self.age()
            self.prune()
            check.assert_not_called()
        self.assertTrue(self.tree.is_dir())

    def test_check_remote_pr_state_and_fail_closed(self):
        self.age()
        real_output = cleanup.output
        count = 1

        def gh(*args, **kwargs):
            if args[0] != "gh":
                return real_output(*args, **kwargs)
            self.assertIn("owner=fixture", args)
            self.assertIn("repo=project", args)
            self.assertIn("ref=refs/heads/topic", args)
            if count is None:
                raise subprocess.CalledProcessError(1, args)
            return json.dumps({"data": {"repository": {"pullRequests": {"totalCount": 0}, "ref": {
                "associatedPullRequests": {"totalCount": count}}}}})

        with patch.object(cleanup, "output", gh):
            self.prune()
            self.assertTrue(self.tree.exists())
            count = None
            with self.assertRaises(subprocess.CalledProcessError):
                self.prune()
            self.assertTrue(self.tree.exists())
            count = 0
            self.prune()
            self.assertFalse(self.tree.exists())

    def test_disconnect_with_named_and_apex_routes(self):
        with patch.object(cleanup, "output", side_effect=[
                "dev.host.xyz  →  127.0.0.1:3000\nhost.xyz  →  127.0.0.1:9000\n",
                "Hostname: host.xyz\n", "", "", ""]) as cli:
            cleanup.close_profile("default")
            calls = [call.args[3:] for call in cli.call_args_list]
            self.assertEqual(calls[2:], [("route", "remove", "dev"), ("route", "remove", "@"), ("down",)])

    @unittest.skipUnless(sys.platform == "linux" and hasattr(os, "pidfd_open") and shutil.which("ss"),
                         "Linux listener discovery")
    def test_stop_only_the_project_dev_server(self):
        with contextlib.ExitStack() as stack:
            for cwd in (self.repo, self.root):
                server = subprocess.Popen([sys.executable, "-u", "-m", "http.server", "0",
                                           "--bind", "127.0.0.1"], cwd=cwd, stdout=subprocess.PIPE)
                stack.callback(server.stdout.close)
                stack.callback(server.wait)
                stack.callback(server.kill)
                self.assertIn(b"Serving HTTP", server.stdout.readline())
                if cwd == self.repo:
                    project = server
            cleanup.stop_servers({self.repo})
            self.assertIsNotNone(project.poll())
            self.assertIsNone(server.poll())


if __name__ == "__main__":
    unittest.main()
