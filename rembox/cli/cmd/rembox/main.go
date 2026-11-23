// Command rembox sets up and manages remote development machines.
package main

import (
	"os"

	"github.com/aakashns/aak.sh/rembox/cli/internal/cli"
)

func main() {
	os.Exit(cli.Main())
}
