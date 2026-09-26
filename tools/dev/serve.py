"""Local dev server for src/ that opens like the deployed site: "/" goes to the self-serve flow.

Run: python3 tools/dev/serve.py [port]   (default 8124; used by .claude/launch.json "maratang-selfserve")

Mirrors .github/workflows/pages.yml, where index.html becomes a redirect to self-serve.html
("/?classic" goes to the legacy flow). Here the legacy page stays reachable at /index.html.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / 'src'
DEFAULT_PORT = 8124


class Handler(SimpleHTTPRequestHandler):
    def redirected(self):
        path, _, query = self.path.partition('?')
        if path != '/':
            return False
        self.send_response(302)
        self.send_header('Location', '/index.html' if 'classic' in query else '/self-serve.html')
        self.end_headers()
        return True

    def do_GET(self):
        if not self.redirected():
            super().do_GET()

    def do_HEAD(self):
        if not self.redirected():
            super().do_HEAD()

    def end_headers(self):
        # dev only: never let the browser reuse an old page, script or regenerated background
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    server = ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=str(SRC)))
    print(f'serving {SRC} on http://localhost:{port}/ (-> self-serve.html)')
    server.serve_forever()
