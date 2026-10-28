#!/usr/bin/env python3
"""Собирает index.html для GitHub Pages из src/homework.html (страница в формате артефакта Claude).

Запуск: python3 build.py
Добавляет полноценный <head>, манифест, иконки и регистрацию service worker.
Версия кэша в sw.js обновляется автоматически, чтобы телефон подхватил новую сборку.
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
src = (ROOT / "src" / "homework.html").read_text(encoding="utf-8")

# всё до первого <header — title, meta, шрифты, стили — уходит в <head>
split = src.find("<header")
head_part, body_part = (src[:split], src[split:]) if split > 0 else ("", src)

HEAD = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#080808" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Домашка">
<style>
:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}img{max-width:100%}[hidden]{display:none!important}
</style>
"""

TAIL = """
<script>
// цвет системной строки следует выбранной теме
(() => {
  const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
  const sync = () => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (bg) metas.forEach(m => { m.removeAttribute('media'); m.content = bg; });
  };
  new MutationObserver(sync).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', sync);
  sync();
})();
try { navigator.storage?.persist?.(); } catch {}
// обновления: проверяем при запуске и при возврате в приложение; новая версия включается сама, если не идёт разбор урока
if ('serviceWorker' in navigator) addEventListener('load', async () => {
  let reg;
  try { reg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }); } catch { return; }
  const hadController = !!navigator.serviceWorker.controller;
  const busy = () => !!document.querySelector('#parse-status:not([hidden])');
  let pending = false;
  const apply = () => { if (busy()) { pending = true; return; } location.reload(); };
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) apply(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reg.update().catch(() => {});
    else if (pending && !busy()) location.reload();
  });
  reg.update().catch(() => {});
});
</script>
</body>
</html>
"""

html = HEAD + head_part.strip() + "\n</head>\n<body>\n" + body_part.strip() + "\n" + TAIL
(ROOT / "index.html").write_text(html, encoding="utf-8")

sw_path = ROOT / "sw.js"
sw = sw_path.read_text(encoding="utf-8")
version = hashlib.sha1(html.encode()).hexdigest()[:10]
sw_path.write_text(re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", sw), encoding="utf-8")
print(f"index.html собран, версия кэша {version}")
