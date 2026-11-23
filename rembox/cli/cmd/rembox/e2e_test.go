package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/aakashns/aak.sh/rembox/cli/internal/release"
	"github.com/aakashns/aak.sh/rembox/cli/internal/release/releasetest"
)

// installScript is the installer the website serves.
const installScript = "../../../site/public/install.sh"

// buildRembox builds this command as the given version.
func buildRembox(t *testing.T, version string) []byte {
	t.Helper()
	out := filepath.Join(t.TempDir(), "rembox")
	cmd := exec.Command("go", "build", "-o", out,
		"-ldflags", "-X github.com/aakashns/aak.sh/rembox/cli/internal/version.Version="+version, ".")
	cmd.Env = append(os.Environ(), "CGO_ENABLED=0")
	if b, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("go build: %v\n%s", err, b)
	}
	bin, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	return bin
}

// run runs a command against the pretend releases, with input as what the
// user types, and returns its output.
func run(t *testing.T, srv *releasetest.Server, env []string, input, name string, args ...string) string {
	t.Helper()
	cmd := exec.Command(name, args...)
	cmd.Stdin = strings.NewReader(input)
	cmd.Env = append(os.Environ(), release.BaseURLEnv+"="+srv.BaseURL())
	cmd.Env = append(cmd.Env, env...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("%s %s: %v\n%s", name, strings.Join(args, " "), err, out)
	}
	return string(out)
}

// TestInstallAndUpgrade installs a release with install.sh, then upgrades it
// with `rembox upgrade`, as a user would.
func TestInstallAndUpgrade(t *testing.T) {
	if testing.Short() {
		t.Skip("builds rembox twice")
	}
	for _, tool := range []string{"sh", "curl"} {
		if _, err := exec.LookPath(tool); err != nil {
			t.Skipf("needs %s", tool)
		}
	}

	srv := releasetest.NewServer()
	defer srv.Close()
	srv.AddRelease("v0.1.0", runtime.GOOS, runtime.GOARCH, buildRembox(t, "0.1.0"))

	dir := filepath.Join(t.TempDir(), "bin")
	env := []string{"REMBOX_INSTALL_DIR=" + dir}
	rembox := filepath.Join(dir, "rembox")

	out := run(t, srv, env, "", "sh", installScript)
	if !strings.Contains(out, "Installed rembox 0.1.0") {
		t.Fatalf("install.sh output:\n%s", out)
	}
	if out := run(t, srv, nil, "", rembox, "version"); !strings.HasPrefix(out, "rembox 0.1.0") {
		t.Fatalf("installed version: %s", out)
	}

	srv.AddRelease("v0.2.0", runtime.GOOS, runtime.GOARCH, buildRembox(t, "0.2.0"))
	out = run(t, srv, nil, "y\n", rembox, "upgrade")
	if !strings.Contains(out, "Upgraded rembox to 0.2.0") {
		t.Fatalf("upgrade output:\n%s", out)
	}
	if out := run(t, srv, nil, "", rembox, "version"); !strings.HasPrefix(out, "rembox 0.2.0") {
		t.Fatalf("upgraded version: %s", out)
	}
	if out := run(t, srv, nil, "", rembox, "upgrade"); !strings.Contains(out, "already the latest") {
		t.Fatalf("second upgrade output:\n%s", out)
	}

	// REMBOX_VERSION installs an older release over a newer one.
	out = run(t, srv, append(env, "REMBOX_VERSION=v0.1.0"), "", "sh", installScript)
	if !strings.Contains(out, "Installed rembox 0.1.0") {
		t.Fatalf("install.sh with REMBOX_VERSION output:\n%s", out)
	}
}

// TestMonorepoChannel exercises the installer and the installed upgrader across
// two pages of releases shared with other projects.
func TestMonorepoChannel(t *testing.T) {
	srv := releasetest.NewServer()
	defer srv.Close()
	srv.AddRelease("rembox-v0.27.1", runtime.GOOS, runtime.GOARCH, buildRembox(t, "0.27.1"))
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Query().Get("page") {
		case "1":
			other := `{"tag_name":"writui-v9.9.9","draft":false,"prerelease":false}`
			fmt.Fprint(w, "["+strings.Repeat(other+",", 99)+other+"]")
		case "2":
			fmt.Fprint(w, `[{"tag_name":"rembox-v9.0.0","draft":false,"prerelease":true},{"tag_name":"rembox-v0.27.1","draft":false,"prerelease":false}]`)
		default:
			http.Error(w, "unexpected page", http.StatusBadRequest)
		}
	}))
	defer api.Close()
	dir := t.TempDir()
	env := []string{"REMBOX_INSTALL_DIR=" + dir, "REMBOX_RELEASES_API_URL=" + api.URL}
	run(t, srv, env, "", "sh", installScript)
	if out := run(t, srv, env, "", filepath.Join(dir, "rembox"), "upgrade"); !strings.Contains(out, "0.27.1 is already the latest") {
		t.Fatal(out)
	}
	run(t, srv, append(env, "REMBOX_VERSION=0.27.1"), "", "sh", installScript)
}

// TestInstallRejectsTampered checks install.sh refuses a binary that doesn't
// match SHA256SUMS and leaves nothing installed.
func TestInstallRejectsTampered(t *testing.T) {
	if _, err := exec.LookPath("curl"); err != nil {
		t.Skip("needs curl")
	}
	srv := releasetest.NewServer()
	defer srv.Close()
	srv.AddRelease("v0.1.0", runtime.GOOS, runtime.GOARCH, []byte("#!/bin/sh\necho real\n"))
	srv.SetFile("v0.1.0", release.AssetName(runtime.GOOS, runtime.GOARCH), []byte("#!/bin/sh\necho evil\n"))

	dir := filepath.Join(t.TempDir(), "bin")
	cmd := exec.Command("sh", installScript)
	cmd.Env = append(os.Environ(), release.BaseURLEnv+"="+srv.BaseURL(), "REMBOX_INSTALL_DIR="+dir)
	out, err := cmd.CombinedOutput()
	if err == nil || !strings.Contains(string(out), "doesn't match its checksum") {
		t.Fatalf("install.sh: err = %v, output:\n%s", err, out)
	}
	if _, err := os.Stat(filepath.Join(dir, "rembox")); !os.IsNotExist(err) {
		t.Error("tampered binary was installed")
	}
}
