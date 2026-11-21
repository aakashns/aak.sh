"""Serve the Collager preview on loopback."""
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "public"


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(HTTPStatus.NOT_FOUND)
        return None


if __name__ == "__main__":
    handler = partial(PreviewHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", 4183), handler) as server:
        server.serve_forever()
