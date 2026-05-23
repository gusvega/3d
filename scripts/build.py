from __future__ import annotations

import html
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
OUT = ROOT / "_site"


def read_frontmatter(markdown: str) -> tuple[dict[str, str], str]:
    if not markdown.startswith("---\n"):
        return {}, markdown

    _, raw_frontmatter, body = markdown.split("---\n", 2)
    data: dict[str, str] = {}
    for line in raw_frontmatter.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            data[key.strip()] = value.strip()
    return data, body.lstrip()


def inline_markup(text: str) -> str:
    escaped = html.escape(text)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    return escaped


def markdown_to_html(markdown: str) -> str:
    lines = markdown.splitlines()
    output: list[str] = []
    paragraph: list[str] = []
    in_list = False

    def flush_paragraph() -> None:
        if paragraph:
            output.append(f"<p>{inline_markup(' '.join(paragraph))}</p>")
            paragraph.clear()

    def close_list() -> None:
        nonlocal in_list
        if in_list:
            output.append("</ul>")
            in_list = False

    for line in lines:
        stripped = line.strip()

        if not stripped:
            flush_paragraph()
            close_list()
            continue

        if stripped.startswith("# "):
            flush_paragraph()
            close_list()
            output.append(f"<h1>{inline_markup(stripped[2:])}</h1>")
            continue

        if stripped.startswith("## "):
            flush_paragraph()
            close_list()
            output.append(f"<h2>{inline_markup(stripped[3:])}</h2>")
            continue

        if stripped.startswith("- "):
            flush_paragraph()
            if not in_list:
                output.append("<ul>")
                in_list = True
            output.append(f"<li>{inline_markup(stripped[2:])}</li>")
            continue

        paragraph.append(stripped)

    flush_paragraph()
    close_list()
    return "\n".join(output)


def render_page(title: str, content: str) -> str:
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{html.escape(title)}</title>
    <link rel="stylesheet" href="styles.css">
    <script type="importmap">
      {{
        "imports": {{
          "three": "./vendor/build/three.module.js"
        }}
      }}
    </script>
    <script type="module" src="script.js"></script>
  </head>
  <body>
    <main class="name-stage">
      <h1 id="page-title" class="sr-only">{html.escape(title)}</h1>
      <canvas class="letter-canvas" aria-labelledby="page-title"></canvas>
    </main>
  </body>
</html>
"""


def render_ferrofluid_page(title: str) -> str:
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#ffffff">
    <title>{html.escape(title)}</title>
    <link rel="stylesheet" href="ferrofluid.css">
    <script type="importmap">
      {{
        "imports": {{
          "three": "./vendor/build/three.module.js"
        }}
      }}
    </script>
    <script type="module" src="ferrofluid.js"></script>
  </head>
  <body class="ferro-body">
    <h1 class="sr-only">{html.escape(title)}</h1>
    <canvas class="fluid-canvas" aria-label="Audio-reactive ferrofluid"></canvas>
    <div class="panel">
      <form class="yt-form" id="yt-form">
        <input id="yt-input" type="text" placeholder="Paste a YouTube link or ID" autocomplete="off" spellcheck="false">
        <button type="submit">Load</button>
      </form>
      <div class="btn-row">
        <button id="mic-btn" type="button">Listen via mic</button>
        <label class="upload-btn">Upload audio
          <input id="file-input" type="file" accept="audio/*" hidden>
        </label>
      </div>
      <p id="status" class="status">Upload an audio file, or load a YouTube song and press “Listen via mic” so the fluid reacts to what’s playing.</p>
      <div id="yt-embed" class="yt-embed" aria-hidden="false"></div>
    </div>
  </body>
</html>
"""


def build() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()

    for asset in (*SRC.glob("*.css"), *SRC.glob("*.js")):
        shutil.copy2(asset, OUT / asset.name)
    if (SRC / "vendor").exists():
        shutil.copytree(SRC / "vendor", OUT / "vendor")

    for path in SRC.glob("*.md"):
        frontmatter, body = read_frontmatter(path.read_text(encoding="utf-8"))
        title = frontmatter.get("title", path.stem)
        output_name = "index.html" if path.name == "index.md" else f"{path.stem}.html"
        if frontmatter.get("app") == "ferrofluid":
            page = render_ferrofluid_page(title)
        else:
            page = render_page(title, markdown_to_html(body))
        (OUT / output_name).write_text(page, encoding="utf-8")


if __name__ == "__main__":
    build()
