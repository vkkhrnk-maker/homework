#!/usr/bin/env python3
"""Собирает index.html для GitHub Pages из src/homework.html (страница в формате артефакта Claude).

Запуск: python3 build.py
Добавляет полноценный <head>, манифест, иконки и регистрацию service worker.
Версия кэша в sw.js обновляется автоматически, чтобы телефон подхватил новую сборку.
"""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
src = (ROOT / "src" / "homework.html").read_text(encoding="utf-8")

# всё до первого <header — title, meta, шрифты, стили — уходит в <head>
split = src.find("<header")
head_part, body_part = (src[:split], src[split:]) if split > 0 else ("", src)
# В собранной странице кодировка уже указана в HEAD.
head_part = re.sub(r'^<meta charset="utf-8">\s*', "", head_part, count=1)

HEAD = """<!doctype html>
<html lang="en">
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
  const busy = () => !!document.querySelector('#parse-status:not([hidden]), #intake-level:not([hidden])');
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

# Отдельная версия оформления на той же логике и тех же данных.
soft_css = (ROOT / "src" / "soft-theme.css").read_text(encoding="utf-8")
soft_html = html.replace('<html lang="en">', '<html lang="en" data-variant="soft">', 1)
soft_html = soft_html.replace("</head>", '<style id="soft-theme">\n' + soft_css + "\n</style>\n</head>", 1)
# Голубой вариант остаётся доступен для сравнения по отдельной ссылке.
blue_html = html.replace('<html lang="en">', '<html lang="en" data-variant="blue">', 1)
# Холодный градиент и компактные контролы, вдохновлённые fromt.app.
fromt_css = (ROOT / "src" / "fromt-theme.css").read_text(encoding="utf-8")
fromt_html = html.replace('<html lang="en">', '<html lang="en" data-variant="fromt" data-intake="unified">', 1)
fromt_html = fromt_html.replace("</head>", '<style id="fromt-theme">\n' + fromt_css + "\n</style>\n</head>", 1)
# Отдельная игровая проба на том же интерфейсе и данных.
playful_css = (ROOT / "src" / "playful-theme.css").read_text(encoding="utf-8")
playful_js = (ROOT / "src" / "playful.js").read_text(encoding="utf-8")
pointer_css = (ROOT / "src" / "learny-pointer.css").read_text(encoding="utf-8")
pointer_js = (ROOT / "src" / "learny-pointer.js").read_text(encoding="utf-8")
playful_assets = {
    p.stem: p.read_text(encoding="utf-8")
    for p in sorted((ROOT / "icons" / "playful").glob("*.svg"))
    if p.stem != "cursor-green"
}
playful_js = playful_js.replace("const svgAssets = {}; // ASSETS_INLINE", "const svgAssets = " + json.dumps(playful_assets, ensure_ascii=False) + ";")
playful_html = fromt_html.replace('data-variant="fromt"', 'data-variant="fromt" data-style="playful"', 1)
playful_html = playful_html.replace("</head>", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800;900&display=swap">\n<style id="playful-theme">\n' + pointer_css + playful_css + "\n</style>\n</head>", 1)
playful_body, playful_end = playful_html.rsplit("</body>", 1)
playful_html = playful_body + '<script id="playful-enhancements">\n' + pointer_js + playful_js + "\n</script>\n</body>" + playful_end
green_html = playful_html.replace('data-style="playful"', 'data-style="playful" data-palette="green"', 1)
bright_html = playful_html.replace('data-style="playful"', 'data-style="playful" data-palette="bright"', 1)
yellow_html = playful_html.replace('data-style="playful"', 'data-style="playful" data-palette="yellow"', 1)
learny_css = (ROOT / "src" / "learny-home.css").read_text(encoding="utf-8")
learny_js = (ROOT / "src" / "learny-home.js").read_text(encoding="utf-8")
learny_mascots = {
    path.stem: path.read_text(encoding="utf-8")
    for path in sorted((ROOT / "icons" / "learny-home").glob("*.svg"))
    if path.stem not in ("attach", "menu", "lesson-arrow")
}
learny_mascots["cursor"] = playful_assets["cursor"]
learny_js = learny_js.replace("const mascotAssets = {}; // MASCOTS_INLINE", "const mascotAssets = " + json.dumps(learny_mascots, ensure_ascii=False) + ";")
learny_html = fromt_html.replace(
    'data-variant="fromt"',
    'data-variant="fromt" data-style="learny" data-theme="light" data-theme-mode="light"',
    1,
)
learny_html = learny_html.replace("</head>", '<style id="learny-home">\n' + pointer_css + learny_css + "\n</style>\n</head>", 1)
learny_body, learny_end = learny_html.rsplit("</body>", 1)
learny_html = learny_body + '<script id="learny-home-script">\n' + pointer_js + learny_js + "\n</script>\n</body>" + learny_end
pages = {
    "index.html": learny_html,
    "soft.html": soft_html,
    "blue.html": blue_html,
    "fromt.html": fromt_html,
    "playful.html": playful_html,
    "playful-green.html": green_html,
    "playful-bright.html": bright_html,
    "playful-yellow.html": yellow_html,
    "learny.html": learny_html,
}
for filename, document in pages.items():
    (ROOT / filename).write_text(document, encoding="utf-8")

sw_path = ROOT / "sw.js"
sw = sw_path.read_text(encoding="utf-8")
# Учитываем основную страницу: выбор другого варианта тоже обновляет офлайн-кэш.
version = hashlib.sha1("".join(filename + "\n" + document for filename, document in pages.items()).encode()).hexdigest()[:10]
sw_path.write_text(re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", sw), encoding="utf-8")
print(f"Собрано {len(pages)} вариантов, версия кэша {version}")
