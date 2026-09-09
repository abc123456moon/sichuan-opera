#!/usr/bin/env python3
"""简化启动脚本 - 避免沙盒 __pycache__ 限制"""
import sys
import os

# 阻止写入 __pycache__
sys.dont_write_bytecode = True

# 切到项目目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# 直接用 runpy 运行 server.py(让 __name__ == '__main__')
import runpy
runpy.run_path('server.py', run_name='__main__')
