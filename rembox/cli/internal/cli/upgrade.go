package cli

import (
	"context"
	"flag"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/aakashns/aak.sh/rembox/cli/internal/release"
	"github.com/aakashns/aak.sh/rembox/cli/internal/version"
)

const upgradeHelp = `Usage: rembox upgrade

Upgrade rembox to the latest release. Shows the current and latest versions
and asks before changing anything. The download is checked against the
release's SHA256SUMS before it replaces this binary. If the binary is in a
folder you can't write to (like /usr/local/bin), run it with sudo.
`

func runUpgrade(a *App, args []string) error {
	if err := parseFlags(flag.NewFlagSet("upgrade", flag.ContinueOnError), args); err != nil {
		return err
	}

	exe, err := a.Executable()
	if err != nil {
		return fmt.Errorf("can't find the rembox binary: %w", err)
	}
	if exe, err = filepath.EvalSymlinks(exe); err != nil {
		return fmt.Errorf("can't find the rembox binary: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	fmt.Fprintln(a.Stdout, "Checking for the latest release...")
	tag, err := a.Releases.Latest(ctx)
	if err != nil {
		return err
	}
	current, latest := version.Version, strings.TrimPrefix(tag, "v")

	if cmp, err := version.Compare(current, latest); err != nil {
		fmt.Fprintf(a.Stdout, "This is a development build (%s); the latest release is %s.\n", current, latest)
	} else if cmp == 0 {
		fmt.Fprintf(a.Stdout, "rembox %s is already the latest version.\n", current)
		return nil
	} else if cmp > 0 {
		fmt.Fprintf(a.Stdout, "rembox %s is newer than the latest release (%s); nothing to do.\n", current, latest)
		return nil
	} else {
		fmt.Fprintf(a.Stdout, "A new version is available: %s -> %s\n", current, latest)
	}

	// Checked before asking, so a yes isn't followed by a permissions error.
	if err := release.CheckWritable(filepath.Dir(exe)); err != nil {
		return fmt.Errorf("can't replace %s; run it as a user who can, e.g. sudo rembox upgrade", exe)
	}

	if !a.confirm(fmt.Sprintf("Replace %s with rembox %s?", exe, latest), false) {
		fmt.Fprintln(a.Stdout, "Upgrade cancelled.")
		return nil
	}

	asset := release.AssetName(a.GOOS, a.GOARCH)
	fmt.Fprintf(a.Stdout, "Downloading %s...\n", asset)
	bin, err := a.Releases.FetchBinary(ctx, tag, a.GOOS, a.GOARCH)
	if err != nil {
		return err
	}
	if err := release.ReplaceExecutable(exe, bin); err != nil {
		return fmt.Errorf("installing the new version: %w", err)
	}
	fmt.Fprintln(a.Stdout, a.paint(green, fmt.Sprintf("Upgraded rembox to %s.", latest)))
	return nil
}

// offerUpgrade is setup's check for a newer rembox, before it connects to the
// server called name. If there is one, it asks whether to upgrade first, and
// if you say yes, says how, and how to carry on, then reports true, so setup
// stops. It stays quiet when it can't tell, like when it's offline or this is
// a development build, so setup carries on.
func (a *App) offerUpgrade(name string) bool {
	current := version.Version
	if !version.Valid(current) || strings.Contains(current, "-") {
		return false
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	tag, err := a.Releases.Latest(ctx)
	if err != nil {
		return false
	}
	latest := strings.TrimPrefix(tag, "v")
	if cmp, err := version.Compare(current, latest); err != nil || cmp >= 0 {
		return false
	}

	a.note(fmt.Sprintf("A new version of rembox is available: %s -> %s", current, latest))
	if !a.confirm(fmt.Sprintf("Upgrade rembox before connecting to %s?", name), true) {
		return false
	}
	upgrade := "rembox upgrade"
	if exe, err := a.Executable(); err == nil {
		if exe, err = filepath.EvalSymlinks(exe); err == nil && release.CheckWritable(filepath.Dir(exe)) != nil {
			upgrade = "sudo rembox upgrade"
		}
	}
	fmt.Fprintf(a.Stdout, "\nTo upgrade rembox, then carry on setting up %s, run:\n\n  %s\n  %s\n",
		name, a.paint(cyan, upgrade), a.paint(cyan, "rembox setup "+name))
	return true
}
