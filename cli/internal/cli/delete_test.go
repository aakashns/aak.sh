package cli

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/aakashns/rembox/cli/internal/config"
)

func TestDelete(t *testing.T) {
	ta := newTestApp(t, "0.1.0")
	for _, name := range []string{"box", "other"} {
		if err := config.SaveServer(ta.configDir, config.Server{Name: name, Host: name + ".example.com", Port: 2222, User: "ada", Key: "/k"}); err != nil {
			t.Fatal(err)
		}
	}

	ta.typing("n")
	ta.mustFail(t, "cancelled", "delete", "box")
	if len(ta.servers(t)) != 2 {
		t.Fatal("deleted after you said no")
	}

	ta.typing("y")
	ta.mustRun(t, "delete", "box")
	if !strings.Contains(ta.stdout.String(), "Delete box (ada@box.example.com, port 2222) from rembox? The server itself stays as it is. [y/N]") {
		t.Errorf("output:\n%s", ta.stdout)
	}
	if got := ta.servers(t); len(got) != 1 || got[0].Name != "other" {
		t.Errorf("left %+v", got)
	}
	sshConfig, err := os.ReadFile(filepath.Join(ta.configDir, "ssh_config"))
	if err != nil || strings.Contains(string(sshConfig), "box.example.com") || !strings.Contains(string(sshConfig), "other.example.com") {
		t.Errorf("ssh_config (%v):\n%s", err, sshConfig)
	}
	if len(ta.commands) != 0 {
		t.Errorf("ran %q", ta.commands)
	}

	ta.mustFail(t, "there's no server named box", "delete", "box")
}

func TestDeleteArgs(t *testing.T) {
	for _, args := range [][]string{{"delete"}, {"delete", "-f", "box"}, {"delete", "a", "b"}} {
		ta := newTestApp(t, "0.1.0")
		if code := ta.Run(args); code != 2 {
			t.Errorf("rembox %q: exit %d, want 2", args, code)
		}
	}
}
