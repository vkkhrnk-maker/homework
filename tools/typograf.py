#!/usr/bin/env python3
"""Типограф Learny: приводит тексты интерфейса и лендинга к правилам из DESIGN.md («4. Тексты»).

Правит сами исходники, а не только собранные страницы, чтобы правило держалось и в пробах, которые не собираются.

Запуск:
  python3 tools/typograf.py           — поправить исходники и показать, что изменилось
  python3 tools/typograf.py --check   — только показать; код выхода 1, если есть что править (так работает тест)
  python3 tools/typograf.py --selftest — проверить сам типограф на примерах
build.py вызывает его первым шагом, поэтому каждая сборка заодно вычищает тексты.

Что делает в русском тексте:
  - «ё» → «е»;
  - короткие слова (все слова в одну-две буквы и «для», «без», «под», «над», «при», «про», «обо», «или») привязывает
    неразрывным пробелом к следующему слову, частицы «ли», «же», «бы» — к предыдущему;
  - тире привязывает к слову перед ним, дефис или короткое тире между словами с пробелами заменяет на длинное тире;
  - число привязывает к следующему слову («8 минут», «10 МБ», «1 из 5»);
  - "прямые" и “английские” кавычки вокруг русского текста заменяет на «елочки»;
  - убирает точку в конце строки (точка между предложениями остается, многоточие и сокращения тоже).
В английском — только точка в конце строки (на лендинге и в пробах; в приложении материал урока не трогаем) и
неразрывный пробел перед единицами («10 MB»). Английские предлоги не привязываются.

Где работает: текст между тегами, видимые атрибуты (aria-label, placeholder, title, alt), строки в коде JS.
Не трогает: теги и остальные атрибуты, CSS, комментарии (кроме «ё»), регулярные выражения, <pre>, <code>, <textarea>,
строки JS без русских букв в приложении, строки с пометкой «типограф: пропустить» (в комментарии на той же строке
или строкой выше). Уже стоящие неразрывные пробелы (\\u00a0, &nbsp;, сам символ) сохраняет как есть;
новые ставит в коде как \\u00a0, в разметке как &nbsp;.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Файлы с текстами. en: убирать ли точку в конце английских строк, period: убирать ли точку в конце вообще.
# На лендинге и в пробах английский — это интерфейс и примеры на страницах тетради, точку убираем в обоих языках.
# В приложении (src/) точку в исходниках не трогаем: строки интерфейса и так чистит uiText() в src/homework.html
# при показе, а объяснения в уроках идут парами ru/en, и правка только русской половины их бы рассинхронизировала.
FILES = {
    "learny-notebook-landing.html": {"en": True, "period": True},
    "learny-composer-probe.html": {"en": True, "period": True},
    "learny-teacher-probe.html": {"en": True, "period": True},
    "learny-notebook-probe.html": {"en": True, "period": True},
    "learny-notebook-home.html": {"en": True, "period": True},
    "learny-looks.js": {"en": True, "period": True},
    "learny-notebook-open.js": {"en": True, "period": True},
    "learny-paper.js": {"en": True, "period": True},
    "src/homework.html": {"en": False, "period": False},
    "src/learny-notebook-app.js": {"en": False, "period": False},
    "src/learny-calm.js": {"en": False, "period": False},
    "src/learny-home.js": {"en": False, "period": False},
    "src/learny-pointer.js": {"en": False, "period": False},
    "src/playful.js": {"en": False, "period": False},
}

NBSP = "\u00a0"
P_ESC = "\ue000"   # \u00a0, уже стоявший в строке JS
P_NEW = "\ue001"   # новый неразрывный пробел
P_EXPR = "\ue002"  # ${...} внутри шаблонной строки
P_ENT = "\ue003"   # &nbsp;, уже стоявший в разметке
NB = "[\u00a0\ue000\ue001\ue003]"
TAG0 = 0xE100      # теги внутри строки заменяются символами из этой области
CYR = re.compile("[А-Яа-яЁё]")
LAT = re.compile("[A-Za-z]")
L = "А-Яа-яЁёA-Za-z0-9"
SHORT3 = "для|без|под|над|при|про|обо|или"
SHORT = re.compile(rf"(?<![{L}\-\ue002’'])(?!(?:ли|же|бы)(?![А-Яа-яЁё]))(?!(?-i:[А-ЯЁ]{{2}})(?![А-Яа-яЁё]))([А-Яа-яЁё]{{1,2}}|{SHORT3})[ \t]+(?=[{L}«\"„“(\ue002\ue100-\ue8ff])", re.I)
PARTICLE = re.compile(rf"(?<=[А-Яа-яЁё])[ \t]+(ли|же|бы)(?![{L}])")
DASH_SPACED = re.compile(r"(?<=[А-Яа-яЁё»\)\.,!?\ue002])[ \t]+[-–][ \t]+(?=[А-Яа-яЁё«\ue002])")
DASH = re.compile(rf"(?<=[^\s\u00a0\ue000\ue001\ue003])[ \t]+—")
NUM_RU = re.compile(r"(?<![\w.,])(\d+)[ \t]+(?=[А-Яа-яЁё%₽])")
NUM_EN = re.compile(r"(?<![\w.,])(\d+)[ \t]+(?=(?:MB|KB|GB|TB|px|min|%)(?![A-Za-z]))")
QUOTES = re.compile(r"(?<![^\s(\u00a0\ue000\ue001\ue003\ue100-\ue8ff])[\"“]([^\"“”<>=\n]*[А-Яа-яЁё][^\"“”<>=\n]*)[\"”](?=$|[\s.,:;!?)…\u00a0\ue000\ue001\ue003\ue100-\ue8ff])")
ABBR = re.compile(r"(?:(?<![A-Za-zА-Яа-яЁё])(?:т\.\s?[дпе]|др|пр|гг?|вв?|см|ср|им|руб|коп|стр|тыс|млн|etc|e\.g|i\.e|vs|Mrs?|Ms|Dr|St|a\.m|p\.m|No)|(?<![^\s.\u00a0])[A-ZА-ЯЁ])\.$", re.I)
HTML_TAG = re.compile(r"</?[A-Za-z][^<>]*>")


def _protect_tags(s):
    tags, closing = [], set()

    def keep(m):
        ch = chr(TAG0 + len(tags))
        tags.append(m.group(0))
        if m.group(0).startswith("</") or m.group(0).lower().startswith("<br"):
            closing.add(ch)
        return ch
    return HTML_TAG.sub(keep, s), tags, closing


def _strip_final_period(s, closing, english):
    """Убирает точку в конце строки. Хвост из закрывающих тегов и пробелов не мешает."""
    tail = len(s)
    while tail and (s[tail - 1] in closing or s[tail - 1] in " \t\n\r"):
        tail -= 1
    if not tail or s[tail - 1] != ".":
        return s
    head = s[:tail]
    if head.endswith("..") or ABBR.search(head):
        return s
    before = head[:-1].rstrip(" \t")
    if len(before) != len(head) - 1 or not before:
        return s  # « .» или одна точка — это не конец фразы
    words = re.findall(rf"[{L}]+", before)
    if not words:
        return s
    if english and len(words) < 2:
        return s  # одиночное английское слово с точкой — скорее код, чем подпись
    return head[:-1] + s[tail:]


def fix_text(s, *, english_period, final=True, period=True):
    """Правит один кусок текста. s уже содержит заглушки P_* вместо неразрывных пробелов и ${...}."""
    has_cyr = bool(CYR.search(s))
    if not has_cyr and not (english_period and LAT.search(s)):
        return s
    s, tags, closing = _protect_tags(s)
    if has_cyr:
        # русские правила — только в строках, где есть русский: длинные английские подсказки для ИИ не трогаем
        s = "\n".join(_fix_russian(line) if CYR.search(line) else line for line in s.split("\n"))
    s = NUM_EN.sub(lambda m: m.group(1) + P_NEW, s)
    if final and period and (has_cyr or english_period):
        s = _strip_final_period(s, closing, english=not has_cyr)
    for i, tag in enumerate(tags):
        s = s.replace(chr(TAG0 + i), tag)
    return s


def _fix_russian(s):
    """Русские правила для одной строки текста."""
    if not re.search(r"\[[^\]]*[ёЁ]", s):
        s = s.replace("ё", "е").replace("Ё", "Е")
    s = QUOTES.sub(lambda m: "«" + m.group(1) + "»", s)
    s = DASH_SPACED.sub(" — ", s)
    for _ in range(2):  # «и в доме»: второй проход ловит слово, которое стоит сразу за первым
        s = SHORT.sub(lambda m: m.group(1) + P_NEW, s)
    s = PARTICLE.sub(lambda m: P_NEW + m.group(1), s)
    s = DASH.sub(P_NEW + "—", s)
    s = NUM_RU.sub(lambda m: m.group(1) + P_NEW, s)
    s = re.sub(r"(?<=\d) (?=\d{3}(?!\d))", P_NEW, s)  # 60 000
    return s


# ---------- строки JS ----------

def _fix_js_literal(body, opts):
    english_ok = opts["en"] and " " in body and not re.search(r"[{};=#/\\]|^\s*[.#\[]", body.replace("\\u00a0", " "))
    if not CYR.search(body) and not english_ok:
        return body
    s = re.sub(r"\\u00[aA]0", P_ESC, body)
    s = fix_text(s, english_period=english_ok, period=opts["period"])
    return s.replace(P_ESC, "\\u00a0").replace(P_NEW, "\\u00a0")


REGEX_BEFORE = set("(,=:[!&|?{};+-*%<>~^") | {"", "return", "typeof", "case", "do", "else", "in", "of", "new",
                                                "delete", "void", "throw", "instanceof", "yield", "await"}


def _skip_string(src, i):
    q, j = src[i], i + 1
    while j < len(src):
        if src[j] == "\\":
            j += 2
            continue
        if src[j] == q or src[j] == "\n":
            return j + 1
        j += 1
    return j


def _skip_regex(src, i):
    j, cls = i + 1, False
    while j < len(src):
        c = src[j]
        if c == "\\":
            j += 2
            continue
        if c == "\n":
            return j
        if cls:
            cls = c != "]"
        elif c == "[":
            cls = True
        elif c == "/":
            j += 1
            while j < len(src) and (src[j].isalnum()):
                j += 1
            return j
        j += 1
    return j


def _fix_comment(text):
    return text if re.search(r"\[[^\]]*[ёЁ]", text) else text.replace("ё", "е").replace("Ё", "Е")


def process_js(src, opts, i=0, until_brace=False):
    """Проходит код JS и правит только строки. Возвращает (новый код, где остановился)."""
    out, n, depth, last = [], len(src), 0, ""
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if c == "/" and nxt == "/":
            j = src.find("\n", i)
            j = n if j < 0 else j
            out.append(_fix_comment(src[i:j])); i = j
        elif c == "/" and nxt == "*":
            j = src.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append(_fix_comment(src[i:j])); i = j
        elif c in "\"'":
            j = _skip_string(src, i)
            out.append(c + _fix_js_literal(src[i + 1:j - 1], opts) + src[j - 1]); i = j; last = "str"
        elif c == "`":
            text, i = _process_template(src, i, opts)
            out.append(text); last = "str"
        elif c == "/" and last in REGEX_BEFORE:
            j = _skip_regex(src, i)
            out.append(src[i:j]); i = j; last = "rx"
        elif c.isspace():
            out.append(c); i += 1
        elif c.isalnum() or c in "_$":
            j = i
            while j < n and (src[j].isalnum() or src[j] in "_$"):
                j += 1
            last = src[i:j]; out.append(last); i = j
        else:
            if c == "{":
                depth += 1
            elif c == "}":
                if until_brace and depth == 0:
                    return "".join(out), i
                depth -= 1
            out.append(c); last = c; i += 1
    return "".join(out), i


def _process_template(src, i, opts):
    chunks, exprs, j, start = [], [], i + 1, i + 1
    while j < len(src):
        c = src[j]
        if c == "\\":
            j += 2
            continue
        if c == "`":
            chunks.append(src[start:j]); j += 1
            break
        if c == "$" and src[j + 1:j + 2] == "{":
            chunks.append(src[start:j])
            code, k = process_js(src, opts, j + 2, until_brace=True)
            exprs.append(code); j = k + 1; start = j
            continue
        j += 1
    joined = P_EXPR.join(chunks)
    fixed = _fix_js_literal(joined, opts)
    parts = fixed.split(P_EXPR)
    if len(parts) != len(chunks):  # на всякий случай: если что-то пошло не так, шаблон остается как был
        parts = chunks
    text = parts[0] + "".join("${" + e + "}" + p for e, p in zip(exprs, parts[1:]))
    return "`" + text + "`", j


# ---------- разметка ----------

VISIBLE_ATTRS = re.compile(r"(\s(?:aria-label|aria-description|placeholder|title|alt)\s*=\s*)(\"[^\"]*\"|'[^']*')", re.I)
HTML_TOKEN = re.compile(r"<!--.*?-->|<(script|style|pre|code|textarea)\b[^>]*>.*?</\1\s*>|<[^>]*>", re.S | re.I)


def _fix_html_text(text, opts, final):
    s = text.replace("&nbsp;", P_ENT)
    s = fix_text(s, english_period=opts["en"], final=final, period=opts["period"])
    return s.replace(P_ENT, "&nbsp;").replace(P_NEW, "&nbsp;")


def _fix_tag(tag, opts):
    if tag.startswith("</") or tag.startswith("<!"):
        return tag
    return VISIBLE_ATTRS.sub(lambda m: m.group(1) + m.group(2)[0] + _fix_html_text(m.group(2)[1:-1], opts, True) + m.group(2)[0], tag)


def process_html(src, opts):
    out, pos = [], 0
    tokens = list(HTML_TOKEN.finditer(src))
    for k, m in enumerate(tokens):
        if m.start() > pos:
            nxt = m.group(0)
            final = nxt.startswith("</") or nxt.lower().startswith(("<br", "<script", "<style"))
            out.append(_fix_html_text(src[pos:m.start()], opts, final))
        tok, name = m.group(0), (m.group(1) or "").lower()
        if tok.startswith("<!--"):
            out.append(_fix_comment(tok))
        elif name == "script":
            open_end = tok.index(">") + 1
            close_start = tok.lower().rindex("</script")
            body, _ = process_js(tok[open_end:close_start], opts)
            out.append(_fix_tag(tok[:open_end], opts) + body + tok[close_start:])
        elif name in ("style", "pre", "code", "textarea"):
            out.append(tok)
        else:
            out.append(_fix_tag(tok, opts))
        pos = m.end()
    out.append(_fix_html_text(src[pos:], opts, True))
    return "".join(out)


SKIP = "типограф: пропустить"


def keep_skipped(before, after):
    """Строку с пометкой «типограф: пропустить» (или строку сразу под такой пометкой) оставляем как была.
    Так помечают места, где перенос задан нарочно: например, русский H1 на телефоне ломается как «Домашка по / английскому»."""
    a, b = before.split("\n"), after.split("\n")
    if len(a) != len(b):
        return after
    for i, line in enumerate(a):
        if SKIP in line or (i and SKIP in a[i - 1]):
            b[i] = line
    return "\n".join(b)


def process_file(path, opts):
    src = path.read_text(encoding="utf-8")
    out = process_html(src, opts) if path.suffix == ".html" else process_js(src, opts)[0]
    return src, keep_skipped(src, out)


# ---------- отчет ----------

def _show(s):
    return s.replace(NBSP, "·").replace("\\u00a0", "·").replace("&nbsp;", "·")


def diff_lines(before, after):
    a, b = before.split("\n"), after.split("\n")
    if len(a) != len(b):
        return [(0, "(число строк изменилось)", "")]
    return [(i + 1, x, y) for i, (x, y) in enumerate(zip(a, b)) if x != y]


def _changed_fragment(x, y):
    """Короткий кусок вокруг правки, чтобы отчет читался без длинных строк кода."""
    p = 0
    while p < min(len(x), len(y)) and x[p] == y[p]:
        p += 1
    sx, sy = len(x), len(y)
    while sx > p and sy > p and x[sx - 1] == y[sy - 1]:
        sx -= 1; sy -= 1
    lo = max(0, p - 40)
    return _show(x[lo:sx + 30]).strip(), _show(y[lo:sy + 30]).strip()


def run(write, files=FILES, root=ROOT, quiet=False):
    total = 0
    for name, opts in files.items():
        path = root / name
        if not path.exists():
            continue
        before, after = process_file(path, opts)
        if before == after:
            continue
        changes = diff_lines(before, after)
        total += len(changes)
        if write:
            # перечитываем прямо перед записью: в папке параллельно работают другие сессии
            if path.read_text(encoding="utf-8") != before:
                print(f"{name}: файл изменился во время проверки, пропускаю — запустите еще раз")
                continue
            path.write_text(after, encoding="utf-8")
        print(f"{name}: {len(changes)} строк")
        if not quiet:
            for line, x, y in changes:
                fx, fy = _changed_fragment(x, y)
                print(f"  {line}: {fx}\n  {' ' * len(str(line))}→ {fy}")
    return total


# ---------- самопроверка ----------

def selftest():
    js = lambda s, en=True: process_js(s, {"en": en, "period": True})[0]
    app = lambda s: process_js(s, {"en": False, "period": False})[0]
    html = lambda s, en=True: process_html(s, {"en": en, "period": True})
    cases = [
        (js('x = "Простыми словами и с примерами."'), 'x = "Простыми словами и\\u00a0с\\u00a0примерами"'),
        (js('x = "Ответ проверяется сразу. Не получилось? Попробуйте еще раз"'), 'x = "Ответ проверяется сразу. Не\\u00a0получилось? Попробуйте еще раз"'),
        (js('x = "Не помните\\u00a0— слово снова через 8\\u00a0минут"'), 'x = "Не\\u00a0помните\\u00a0— слово снова через 8\\u00a0минут"'),
        (js('x = "Ошибка — тоже урок"'), 'x = "Ошибка\\u00a0— тоже урок"'),
        (js("x = 'Ещё раз - и всё'"), "x = 'Еще раз\\u00a0— и\\u00a0все'"),
        (js('x = `В уроке ${n} слов.`'), 'x = `В\\u00a0уроке ${n} слов`'),
        (js('x = `Вы\\u00a0написали «${raw}» — это опечатка, верно <b>${best}</b>.`'), 'x = `Вы\\u00a0написали «${raw}»\\u00a0— это опечатка, верно <b>${best}</b>`'),
        (js('x = "Нажмите \\"Готово\\" и т. д."'), 'x = "Нажмите \\"Готово\\" и\\u00a0т. д."'),
        (js("x = 'Кнопка \"Готово\" внизу'"), "x = 'Кнопка «Готово» внизу'"),
        (js('x = "Фото или\\u00a0PDF до 10 МБ"'), 'x = "Фото или\\u00a0PDF до\\u00a010\\u00a0МБ"'),
        (js('const CYR = /[А-Яа-яЁё]/; // остаётся'), 'const CYR = /[А-Яа-яЁё]/; // остается'),
        (js('x = a / b; y = "Готово."'), 'x = a / b; y = "Готово"'),
        (js('x = "Employees must follow the rules."'), 'x = "Employees must follow the rules"'),
        (js('x = "Employees must follow the rules."', False), 'x = "Employees must follow the rules."'),
        (app('x = { ru: "Совет, а не приказ.", en: "Advice, not an order." }'), 'x = { ru: "Совет, а\\u00a0не\\u00a0приказ.", en: "Advice, not an order." }'),
        (js('x = "ИИ разложит текст, больше 60 000 символов"'), 'x = "ИИ разложит текст, больше 60\\u00a0000\\u00a0символов"'),
        (js('x = "in the end of it"'), 'x = "in the end of it"'),
        (js('x = "learny-paper.js"; y = "Done."'), 'x = "learny-paper.js"; y = "Done."'),
        (js('x = "Возможно ли это"'), 'x = "Возможно\\u00a0ли это"'),
        (js('x = "Подождите..."'), 'x = "Подождите..."'),
        (html('<p class="a b">Well done. See you on Thursday.</p>'), '<p class="a b">Well done. See you on Thursday</p>'),
        (html('<p>Фото\n  и файл.</p><input placeholder="Вставьте и отправьте.">'), '<p>Фото\n  и&nbsp;файл</p><input placeholder="Вставьте и&nbsp;отправьте">'),
        (html('<p>Сказано. <b>Дальше</b> так</p>'), '<p>Сказано. <b>Дальше</b> так</p>'),
        (html('<style>.a::after{content:"и т."}</style><!-- и ещё -->'), '<style>.a::after{content:"и т."}</style><!-- и еще -->'),
        (html('<script>const t = "Up to 10 MB.";</script>'), '<script>const t = "Up to 10\\u00a0MB";</script>'),
    ]
    bad = [(got, want) for got, want in cases if got != want]
    for got, want in bad:
        print("ожидалось:", want, "\nполучилось:", got, "\n")
    print(f"самопроверка: {len(cases) - len(bad)} из {len(cases)}")
    return not bad


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(0 if selftest() else 1)
    check = "--check" in sys.argv
    count = run(write=not check)
    if check and count:
        print(f"\nТипограф нашел {count} строк с правками. Запустите: python3 tools/typograf.py")
        sys.exit(1)
    print("Тексты в порядке" if not count else f"Типограф поправил {count} строк")
