package cli

import (
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/aakashns/rembox/cli/internal/config"
	"github.com/aakashns/rembox/cli/internal/release"
)

const implodeHelp = `Usage: rembox implode

Remove rembox from this machine: the rembox binary, its files in
~/.config/rembox (or $XDG_CONFIG_HOME/rembox), which say how to log in to
your servers, and the line in ~/.ssh/config that includes them, if 'rembox
setup' added it. Lists what it will remove and asks first. Servers set up
with rembox aren't changed.

First it saves a copy of your servers' ssh config in /tmp and shows it: note
down each server's address and SSH port, as rembox moved ssh to a new port
that only your key can log in on.

If the binary is in a folder only root can write to, it removes it with sudo,
showing the command and asking before it runs it. Run implode itself without
sudo, so it finds your files.
`

func runImplode(a *App, args []string) error {
	if err := parseFlags(flag.NewFlagSet("implode", flag.ContinueOnError), args); err != nil {
		return err
	}
	// As root, ~ is root's, so rembox would look for the wrong files.
	if a.Euid == 0 && os.Getenv("SUDO_USER") != "" {
		return errors.New("run rembox implode without sudo; it asks for sudo itself if it needs it")
	}

	exe, err := a.Executable()
	if err == nil {
		exe, err = filepath.EvalSymlinks(exe)
	}
	if err != nil {
		return fmt.Errorf("can't find the rembox binary: %w", err)
	}
	dir, err := a.ConfigDir()
	if err != nil {
		return err
	}
	_, err = os.Lstat(dir)
	dirExists := err == nil
	home, err := a.HomeDir()
	if err != nil {
		return fmt.Errorf("can't find your home folder: %w", err)
	}
	included, err := hasInclude(home, dir)
	if err != nil {
		return err
	}

	fmt.Fprintln(a.Stdout, "This removes rembox from this machine:")
	fmt.Fprintf(a.Stdout, "  %s\n", exe)
	if dirExists {
		fmt.Fprintf(a.Stdout, "  %s\n", dir)
	}
	if included {
		fmt.Fprintf(a.Stdout, "  '%s' in ~/.ssh/config\n", includeLine(home, dir))
	}
	sshConfig, err := os.ReadFile(config.SSHConfig(dir))
	if err != nil && !errors.Is(err, fs.ErrNotExist) {
		return err
	}
	hasServers := strings.Contains(string(sshConfig), "\nHost ")
	if hasServers {
		fmt.Fprintf(a.Stdout, "It saves a copy of %s in %s first.\n", config.SSHConfig(dir), a.BackupDir)
	}
	fmt.Fprintln(a.Stdout, "Servers set up with rembox aren't changed.")

	// Checked before asking, so a yes isn't followed by a permissions error.
	needSudo := release.CheckWritable(filepath.Dir(exe)) != nil

	if !a.confirm("Remove rembox and its files?", false) {
		fmt.Fprintln(a.Stdout, "Nothing was removed.")
		return nil
	}

	if hasServers {
		backup, err := backUp(a.BackupDir, sshConfig)
		if err != nil {
			return fmt.Errorf("saving a copy of %s: %w; nothing was removed", config.SSHConfig(dir), err)
		}
		fmt.Fprintf(a.Stdout, "Saved a copy of your servers' ssh config in %s:\n\n%s", backup, sshConfig)
		a.note("Note down each server's HostName and Port: rembox moved ssh to that port, and only your key logs in, so you'll need both to log in again.")
		fmt.Fprintln(a.Stdout)
	}

	// The binary goes first: if sudo is declined or fails, nothing is removed.
	if needSudo {
		fmt.Fprintf(a.Stdout, "Removing %s needs sudo:\n", exe)
		err = a.runConfirmed("sudo", "rm", "-f", "--", exe)
		if errors.Is(err, errDeclined) {
			fmt.Fprintln(a.Stdout, "Nothing was removed.")
			return nil
		}
	} else {
		err = os.Remove(exe)
	}
	if err != nil {
		return fmt.Errorf("removing %s: %w; nothing was removed", exe, err)
	}
	fmt.Fprintf(a.Stdout, "Removed %s\n", exe)

	if dirExists {
		if err := os.RemoveAll(dir); err != nil {
			return fmt.Errorf("removing %s: %w; delete it yourself to finish", dir, err)
		}
		fmt.Fprintf(a.Stdout, "Removed %s\n", dir)
	}
	if included {
		if _, err := removeInclude(home, dir); err != nil {
			return fmt.Errorf("%w; take '%s' out of ~/.ssh/config yourself to finish", err, includeLine(home, dir))
		}
		fmt.Fprintf(a.Stdout, "Removed '%s' from ~/.ssh/config\n", includeLine(home, dir))
	}
	fmt.Fprintln(a.Stdout, a.paint(green, "rembox is gone.")+" To reinstall: curl -fsSL https://rembox.aakashns.com/install.sh | sh")
	return nil
}

// backUp writes data to a new file in dir, readable only by you, and returns
// its path.
func backUp(dir string, data []byte) (string, error) {
	f, err := os.CreateTemp(dir, "rembox-ssh_config-*")
	if err != nil {
		return "", err
	}
	if _, err := f.Write(data); err != nil {
		f.Close()
		return "", err
	}
	return f.Name(), f.Close()
}

func plural(n int, word string) string {
	if n == 1 {
		return "1 " + word
	}
	return fmt.Sprintf("%d %ss", n, word)
}
