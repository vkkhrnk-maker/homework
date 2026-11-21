#!/usr/bin/env python3
"""Собирает только три прототипа Calm из общих исходников."""
import pathlib
import subprocess
import sys

if __name__ == "__main__":
    subprocess.run([sys.executable, pathlib.Path(__file__).with_name("build.py"), "--previews-only"], check=True)
