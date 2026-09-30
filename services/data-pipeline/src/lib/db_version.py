"""
db_version.py — bumps DB_VERSION in the web app's next.config.ts for each build,
so the web app and API pick up the newly built database files.
"""

import re

from ..paths import WEB_CONFIG

# Matches:  DB_VERSION: 'v77'
# Captures: the numeric version (e.g. "77") so it can be incremented.
DB_VERSION_READ_PATTERN = re.compile(r"DB_VERSION:\s*'v(\d+)'")

# Matches the full DB_VERSION assignment so the version number can be replaced in-place.
# Group 1 captures the prefix (DB_VERSION: 'v), group 2 captures the closing quote.
DB_VERSION_REPLACE_PATTERN = re.compile(r"(DB_VERSION:\s*'v)\d+(')")


def bump_version() -> str:
    """Reads DB_VERSION from next.config.ts, increments it, writes it back, and returns the new version string."""
    config_text = WEB_CONFIG.read_text(encoding="utf-8")
    version_match = DB_VERSION_READ_PATTERN.search(config_text)
    if not version_match:
        raise RuntimeError("DB_VERSION not found in next.config.ts")
    next_version_number = int(version_match.group(1)) + 1
    updated_config_text = DB_VERSION_REPLACE_PATTERN.sub(
        rf"\g<1>{next_version_number}\g<2>", config_text
    )
    WEB_CONFIG.write_text(updated_config_text, encoding="utf-8")
    return f"v{next_version_number}"
