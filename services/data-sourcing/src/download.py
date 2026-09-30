"""
download.py — scrapes source documents and saves them to data/sources/.

Port of packages/data-sourcing/src/download.ts.
Run: python -m src.download  (from services/data-sourcing/)

  - sources.py    — reads sources.json and picks each source's output filename
  - rate_limit.py — per-domain delay between requests
  - paths.py      — project file locations
"""

import asyncio
from dataclasses import dataclass

from playwright.async_api import async_playwright, Browser, Page

from .paths import OUTPUT_DIR
from .rate_limit import extract_hostname, mark_fetched, wait_for_domain_cooldown
from .sources import Source, load_sources, output_path

PAGE_TIMEOUT_MS = 30_000


@dataclass
class Counts:
    downloaded: int = 0
    skipped_existing: int = 0
    skipped_bad_status: int = 0
    failed: int = 0


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

    mark_fetched(hostname, last_fetched)
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
    sources = load_sources()
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
