from http.server import BaseHTTPRequestHandler, HTTPServer
import os

PORT = 8000  # You can change the port number as needed

class CORSRequestHandler(BaseHTTPRequestHandler):
  def end_headers (self):
    self.send_header('Access-Control-Allow-Origin', '*')  # Allow all origins (adjust for security)
    self.send_header('Content-Type', 'text/html' if self.path.endswith('.html') else 'application/javascript')
    BaseHTTPRequestHandler.end_headers(self)

  def do_GET(self):
    # Set the default file to serve
    filename = 'index.html'

    # Check if a specific path is requested
    if self.path != '/':
      filename = self.path.strip('/')

    # Check if file exists
    if os.path.exists(filename):
      with open(filename, 'rb') as f:
        content = f.read()
        self.send_response(200)
        self.end_headers()
        self.wfile.write(content)
    else:
      self.send_error(404, 'File not found')

with HTTPServer(('', PORT), CORSRequestHandler) as httpd:
  print(f"Serving on port {PORT}")
  httpd.serve_forever()
