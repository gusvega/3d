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
  </head>
  <body>
    <main>
{content}
    </main>
  </body>
</html>
"""


def build() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()

    shutil.copy2(SRC / "styles.css", OUT / "styles.css")

    for path in SRC.glob("*.md"):
        frontmatter, body = read_frontmatter(path.read_text(encoding="utf-8"))
        title = frontmatter.get("title", path.stem)
        content = markdown_to_html(body)
        output_name = "index.html" if path.name == "index.md" else f"{path.stem}.html"
        (OUT / output_name).write_text(render_page(title, content), encoding="utf-8")


if __name__ == "__main__":
    build()
