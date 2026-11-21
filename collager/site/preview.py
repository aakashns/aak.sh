"""Serve the Collager preview on loopback with HTTP Basic authentication."""
import base64
import hmac
import os
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "public"


class PreviewHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        supplied = self.headers.get("Authorization", "").encode("latin1")
        if not hmac.compare_digest(supplied, self.server.authorization):
            self.send_response(HTTPStatus.UNAUTHORIZED)
            self.send_header("WWW-Authenticate", 'Basic realm="Collager preview"')
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(HTTPStatus.NOT_FOUND)
        return None


if __name__ == "__main__":
    password = os.environ["COLLAGER_PREVIEW_PASSWORD"]
    if not password:
        raise SystemExit("Set a non-empty COLLAGER_PREVIEW_PASSWORD.")
    handler = partial(PreviewHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", 4183), handler) as server:
        server.authorization = b"Basic " + base64.b64encode(f"collager:{password}".encode())
        server.serve_forever()
