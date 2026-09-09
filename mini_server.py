#!/usr/bin/env python3
"""简易静态文件服务器 - 不依赖 http.server 模块,避免沙盒 __pycache__ 限制"""
import os
import socket
import sys
import urllib.request
import json

PORT = 8000
WEB_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(WEB_DIR)

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
}

KIMI_API_KEY = "sk-V4OOG6MM0jXO7whUQ0eaiyQfzatqZCMu2Lfq7zWxiyEzpTWc"
KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions"


def handle_request(method, path, body=None):
    # API proxy
    if method == 'POST' and path == '/api/chat':
        try:
            req_data = json.loads(body) if body else {}
            messages = req_data.get('messages', [])
            payload = json.dumps({
                "model": "moonshot-v1-8k",
                "messages": messages,
                "temperature": 0.7
            }).encode('utf-8')
            req = urllib.request.Request(KIMI_API_URL, data=payload, method='POST')
            req.add_header('Content-Type', 'application/json')
            req.add_header('Authorization', 'Bearer ' + KIMI_API_KEY)
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = resp.read().decode('utf-8')
                return 200, 'application/json; charset=utf-8', result.encode('utf-8')
        except Exception as e:
            err = json.dumps({"error": str(e)}).encode('utf-8')
            return 500, 'application/json; charset=utf-8', err

    if method == 'OPTIONS':
        return 200, '', b''

    # Static files
    if path == '/':
        path = '/index.html'
    # Remove query string
    path = path.split('?')[0]
    filepath = os.path.join(WEB_DIR, path.lstrip('/'))

    if not os.path.isfile(filepath):
        return 404, 'text/plain; charset=utf-8', b'404 Not Found'

    ext = os.path.splitext(filepath)[1].lower()
    ctype = MIME.get(ext, 'application/octet-stream')

    with open(filepath, 'rb') as f:
        content = f.read()
    return 200, ctype, content


def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('0.0.0.0', PORT))
    sock.listen(5)
    print(f'Server running on http://localhost:{PORT}/')
    sys.stdout.flush()

    while True:
        conn, addr = sock.accept()
        try:
            conn.settimeout(10)
            data = b''
            while b'\r\n\r\n' not in data:
                chunk = conn.recv(4096)
                if not chunk:
                    break
                data += chunk

            lines = data.split(b'\r\n')
            request_line = lines[0].decode('utf-8', errors='replace')
            parts = request_line.split(' ')
            if len(parts) < 2:
                conn.close()
                continue
            method = parts[0]
            path = parts[1]

            body = None
            if method == 'POST':
                # Read body
                content_length = 0
                for line in lines:
                    if line.lower().startswith(b'content-length:'):
                        content_length = int(line.split(b':')[1].strip())
                        break
                body_data = data.split(b'\r\n\r\n', 1)[1] if b'\r\n\r\n' in data else b''
                while len(body_data) < content_length:
                    chunk = conn.recv(4096)
                    if not chunk:
                        break
                    body_data += chunk
                body = body_data.decode('utf-8', errors='replace')

            status, ctype, content = handle_request(method, path, body)

            status_text = 'OK' if status == 200 else 'Not Found' if status == 404 else 'Error'
            header = f'HTTP/1.1 {status} {status_text}\r\n'
            header += f'Content-Type: {ctype}\r\n'
            header += f'Content-Length: {len(content)}\r\n'
            header += 'Access-Control-Allow-Origin: *\r\n'
            header += 'Access-Control-Allow-Methods: POST, OPTIONS, GET\r\n'
            header += 'Access-Control-Allow-Headers: Content-Type\r\n'
            header += 'Cache-Control: no-cache\r\n'
            header += '\r\n'
            conn.sendall(header.encode('utf-8') + content)
        except Exception as e:
            try:
                err = f'HTTP/1.1 500 Internal Server Error\r\nContent-Length: 0\r\n\r\n'
                conn.sendall(err.encode('utf-8'))
            except:
                pass
        finally:
            conn.close()


if __name__ == '__main__':
    main()
