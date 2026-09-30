"""
rate_limit.py — per-domain politeness delay, so the downloader never hits the same
website more than once every DOMAIN_DELAY_SECONDS.
"""

import asyncio
import time
from urllib.parse import urlparse

DOMAIN_DELAY_SECONDS = 2.0


def extract_hostname(url: str) -> str:
    try:
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


def mark_fetched(hostname: str, last_fetched: dict[str, float]) -> None:
    last_fetched[hostname] = time.monotonic()
