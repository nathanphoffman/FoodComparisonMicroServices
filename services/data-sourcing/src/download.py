"""
download.py — scrapes source documents and saves them to lib/data/sources/.

Port of packages/data-sourcing/src/download.ts.
Run: python src/download.py
"""

import asyncio
import json
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, Browser, Page

# Root = MicroserviceArchitecture/ (self-contained — no parent references)
# services/data-sourcing/src/ → services/data-sourcing/ → services/ → MicroserviceArchitecture/
ROOT         = Path(__file__).resolve().parents[3]
SOURCES_JSON = ROOT / "data" / "json" / "sources.json"
OUTPUT_DIR   = ROOT / "data" / "sources"

DOMAIN_DELAY_SECONDS = 2.0
PAGE_TIMEOUT_MS = 30_000
FORBIDDEN_CHARS = r'[/\\:*?"<>|]'


@dataclass
class Source:
    id: int
    url: str
    title: str
    notes: list[str] = field(default_factory=list)
    _status: Optional[str] = None


@dataclass
class Counts:
    downloaded: int = 0
    skipped_existing: int = 0
    skipped_bad_status: int = 0
    failed: int = 0


def sanitize_title(title: str) -> str:
    cleaned = re.sub(FORBIDDEN_CHARS, "", title)
    return re.sub(r"\s+", " ", cleaned).strip()


def output_path(source: Source) -> Path:
    return OUTPUT_DIR / f"{source.id} - {sanitize_title(source.title)}.txt"


def extract_hostname(url: str) -> str:
    try:
        from urllib.parse import urlparse
        return urlparse(url).hostname or url
    except Exception:
        return url


async def wait_for_domain_cooldown(
    hostname: str,
    last_fetched: dict[str, float],
) -> None:
    last = last_fetched.get(hostname)
    if last is None:
        return
    elapsed = time.monotonic() - last
    if elapsed < DOMAIN_DELAY_SECONDS:
        await asyncio.sleep(DOMAIN_DELAY_SECONDS - elapsed)


async def download_source(
    source: Source,
    browser: Browser,
    last_fetched: dict[str, float],
) -> None:
    hostname = extract_hostname(source.url)
    await wait_for_domain_cooldown(hostname, last_fetched)

    page: Page = await browser.new_page()
    await page.goto(source.url, wait_until="networkidle", timeout=PAGE_TIMEOUT_MS)
    body_text = await page.inner_text("body")
    output_path(source).write_text(body_text, encoding="utf-8")
    await page.close()

    last_fetched[hostname] = time.monotonic()
    print(f"DOWNLOADED: {source.id} - {source.title}")


async def process_sources(sources: list[Source], browser: Browser) -> Counts:
    counts = Counts()
    last_fetched: dict[str, float] = {}

    for source in sources:
        if output_path(source).exists():
            counts.skipped_existing += 1
            continue

        if source._status:
            print(f"SKIPPED ({source._status}): {source.id} - {source.title}")
            counts.skipped_bad_status += 1
            continue

        try:
            await download_source(source, browser, last_fetched)
            counts.downloaded += 1
        except Exception as exc:
            print(f"FAILED: {source.id} - {source.title} — {exc}")
            counts.failed += 1

    return counts


async def _run() -> None:
    raw: list[dict] = json.loads(SOURCES_JSON.read_text(encoding="utf-8"))
    sources = [
        Source(
            id=s["id"],
            url=s["url"],
            title=s["title"],
            notes=s.get("notes") or [],
            _status=s.get("_status"),
        )
        for s in raw
    ]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        counts = await process_sources(sources, browser)
        await browser.close()

    print(
        f"\nDone. Downloaded: {counts.downloaded}, "
        f"Skipped (existing): {counts.skipped_existing}, "
        f"Skipped (bad status): {counts.skipped_bad_status}, "
        f"Failed: {counts.failed}"
    )


def main() -> None:
    asyncio.run(_run())


if __name__ == "__main__":
    main()
