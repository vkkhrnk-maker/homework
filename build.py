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
import sys

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
<link rel="icon" href="icons/klyaksa-192.png" type="image/png" sizes="192x192">
<link rel="icon" href="icons/klyaksa-16.svg" type="image/svg+xml" sizes="any">
<link rel="apple-touch-icon" href="icons/klyaksa-touch.png">
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
  if (!reg) return;
  const hadController = !!navigator.serviceWorker.controller;
  const busy = () => !!document.querySelector('#parse-status:not([hidden]), #intake-level:not([hidden]), #lesson-composer[open]')
    || !!document.querySelector('#lesson-composer #paste-area')?.value || !!document.querySelector('#lesson-composer .material-remove');
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
    if path.stem == "brand-book" or path.stem.startswith(("step-", "lesson-")) and path.stem != "lesson-arrow"
}
learny_js = learny_js.replace("const mascotAssets = {}; // MASCOTS_INLINE", "const mascotAssets = " + json.dumps(learny_mascots, ensure_ascii=False) + ";")
learny_html = fromt_html.replace(
    'data-variant="fromt"',
    'data-variant="fromt" data-style="learny" data-theme="light" data-theme-mode="light"',
    1,
)
learny_html = learny_html.replace("</head>", '<style id="learny-home">\n' + learny_css + "\n</style>\n</head>", 1)
learny_body, learny_end = learny_html.rsplit("</body>", 1)
learny_html = learny_body + '<script id="learny-home-script">\n' + learny_js + "\n</script>\n</body>" + learny_end
# В рабочей версии Learny первый экран B ведёт в урок или кабинет.
calm_css = (ROOT / "src" / "learny-calm.css").read_text(encoding="utf-8")
calm_js = (ROOT / "src" / "learny-calm.js").read_text(encoding="utf-8")
learny_html = learny_html.replace('data-theme="light" data-theme-mode="light"', 'data-calm data-hero="b"', 1)
learny_html = learny_html.replace("</head>", '<style id="learny-calm">\n' + calm_css + "\n</style>\n</head>", 1)
body, end = learny_html.rsplit("</body>", 1)
learny_html = body + '<script id="learny-calm-script">\n' + calm_js + "\n</script>\n</body>" + end
# Главная ссылка всегда открывает лендинг, еще до отрисовки приложения: и новому человеку, и тому, кто уже занимался
# (решение Виктории 23 ноября 2026). В приложение ведут ссылки внутрь: урок, кабинет («My space»), код кабинета.
# Установленное приложение открывается сразу в кабинете (start_url в manifest.webmanifest).
landing_redirect = """<script>
(function(){try{
  if (location.hash && location.hash !== "#welcome") return;
  location.replace(window.learnyPaperURL?.("landing.html") || "landing.html");
}catch(e){}})();
</script>
"""
learny_html = learny_html.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n' + landing_redirect, 1)
# Лендинг: исходник learny-notebook-landing.html публикуется как landing.html; версия в ссылках на стили и скрипт считается по их содержимому.
landing_assets = ["learny-paper.css", "learny-paper.js", "learny-notebook.css", "learny-notebook-landing.css", "learny-notebook-open.js", "learny-looks.css", "learny-looks.js"]
landing_version = hashlib.sha1(b"".join((ROOT / name).read_bytes() for name in landing_assets)).hexdigest()[:10]
landing_html = re.sub(r'(learny-paper\.(?:css|js)|learny-notebook(?:-landing)?\.css|learny-notebook-open\.js|learny-looks\.(?:css|js))(\?v=[0-9a-f]+)?"', lambda m: m.group(1) + "?v=" + landing_version + '"', (ROOT / "learny-notebook-landing.html").read_text(encoding="utf-8"))
# Встроенный SVG наследует цвет чернил темы и виден при открытии HTML с диска.
brand_logo = (ROOT / "icons/learny-wordmark.svg").read_text(encoding="utf-8").strip()
landing_html = landing_html.replace('<img class="learny-logo" src="icons/learny-wordmark.svg" alt="">', brand_logo)
pages = {
    "landing.html": landing_html,
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
# Локальные варианты для сравнения открываются отдельно от офлайн-оболочки.
preview = learny_html.replace("if ('serviceWorker' in navigator) addEventListener('load'", "if (false) addEventListener('load'", 1)
for filename, hero in (("learny-calm.html", "b"), ("learny-calm-a.html", "a"), ("learny-calm-c.html", "c")):
    (ROOT / filename).write_text(preview.replace('data-hero="b"', f'data-hero="{hero}"', 1), encoding="utf-8")
# Основные точки входа сохраняют адрес, хранилище и маршруты уроков.
paper_css = (ROOT / "learny-paper.css").read_text(encoding="utf-8")
paper_js = (ROOT / "learny-paper.js").read_text(encoding="utf-8")
notebook_css = (ROOT / "src" / "learny-notebook-app.css").read_text(encoding="utf-8")
notebook_js = (ROOT / "src" / "learny-notebook-app.js").read_text(encoding="utf-8")
notebook_html = learny_html.replace('data-calm data-hero="b"', 'data-calm data-hero="b" data-nb', 1)
notebook_html = re.sub(r'<i id="brand-dot"[^>]*>.*?</i>', lambda _: brand_logo, notebook_html, count=1)
notebook_html = notebook_html.replace('<span class="footer-name" data-ui="brandName"></span>',
                                      '<span class="footer-name" role="img" aria-label="Learny">' + brand_logo + '</span>', 1)
notebook_html = notebook_html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script>' + paper_js + '</script>', 1)
# Темная тема приложения выключена, пока ее дорабатывают (23 ноября 2026): приложение всегда светлое, переключатель темы
# в меню скрыт. Посмотреть темную для доработки — параметр ?dark=1 в адресе. Включить для всех — DARK_READY = True.
DARK_READY = False
if not DARK_READY:
    notebook_html = notebook_html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script>if (!/[?&]dark=1(&|$)/.test(location.search)) { document.documentElement.dataset.theme = "light"; document.documentElement.dataset.themeMode = "light"; }</script>', 1)
# Стилистика лендинга G (23 ноября 2026): Geist 400 — интерфейс и английский текст, Sofia Sans Extra Condensed 900 — крупные заголовки,
# Caveat 600 — пометки от руки. Других начертаний приложение не грузит: Golos Text и Literata нижних слоев убраны.
notebook_html = re.sub(r'<link rel="stylesheet" crossorigin="anonymous" href="https://fonts\.googleapis\.com/css2\?family=Golos\+Text[^"]*">\n?', "", notebook_html)
notebook_html = notebook_html.replace("</head>", '<link rel="stylesheet" crossorigin="anonymous" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Geist:wght@400&family=Sofia+Sans+Extra+Condensed:wght@900&display=swap">\n<style id="learny-notebook-app">\n' + paper_css + notebook_css + "\n</style>\n</head>", 1)
notebook_body, notebook_end = notebook_html.rsplit("</body>", 1)
notebook_html = notebook_body + '<script id="learny-notebook-app-script">\n' + notebook_js + "\n</script>\n</body>" + notebook_end
pages["index.html"] = pages["learny.html"] = notebook_html
(ROOT / "learny-notebook-app.html").write_text(notebook_html.replace("if ('serviceWorker' in navigator) addEventListener('load'", "if (false) addEventListener('load'", 1), encoding="utf-8")
if "--previews-only" in sys.argv:
    print("Собраны три варианта Calm для сравнения")
    sys.exit(0)
for filename, document in pages.items():
    (ROOT / filename).write_text(document, encoding="utf-8")
local_entry = ROOT / "english-homework.html"
if local_entry.exists():
    local_entry.write_text(notebook_html, encoding="utf-8")

sw_path = ROOT / "sw.js"
sw = sw_path.read_text(encoding="utf-8")
asset_urls = [f"{name}?v={landing_version}" for name in landing_assets]
sw = re.sub(r"const LANDING_ASSETS = \[.*?\];", "const LANDING_ASSETS = " + json.dumps(asset_urls) + ";", sw)
# Учитываем основную страницу: выбор другого варианта тоже обновляет офлайн-кэш.
version = hashlib.sha1("".join(filename + "\n" + document for filename, document in pages.items()).encode()).hexdigest()[:10]
sw_path.write_text(re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", sw), encoding="utf-8")
print(f"Собрано {len(pages)} вариантов, версия кэша {version}")
