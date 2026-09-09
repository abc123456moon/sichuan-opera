#!/usr/bin/env python3
"""
川剧文化小站 - 静态文件服务器 + Kimi API 代理
用法: python server.py
然后在浏览器打开 http://localhost:8000/
"""
import json
import os
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler

# ===== Kimi API 配置 =====
KIMI_API_KEY = "sk-V4OOG6MM0jXO7whUQ0eaiyQfzatqZCMu2Lfq7zWxiyEzpTWc"
KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions"

PORT = 8000
WEB_DIR = os.path.dirname(os.path.abspath(__file__))


class OperaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_POST(self):
        # /api/chat 代理转发到 Kimi API
        if self.path == "/api/chat":
            self._proxy_kimi()
        else:
            self.send_error(404, "Not Found")

    def _proxy_kimi(self):
        try:
            # 读取前端发来的 body
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            # 转发到 Kimi API
            req = urllib.request.Request(
                KIMI_API_URL,
                data=body,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + KIMI_API_KEY,
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp_data = resp.read()

            # 返回给前端
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(resp_data)

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(err_body.encode("utf-8"))

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(
                {"error": str(e)}
            ).encode("utf-8"))

    def do_OPTIONS(self):
        # 处理 CORS 预检
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), OperaHandler)
    print("川剧文化小站服务器已启动:")
    print("  地址: http://localhost:%d/" % PORT)
    print("  API 代理: /api/chat -> Kimi (Moonshot)")
    print("  按 Ctrl+C 停止")
    server.serve_forever()
