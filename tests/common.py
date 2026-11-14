"""Shared helpers for the Life OS browser tests."""
import os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = pathlib.Path(__file__).resolve().parent / "screenshots"


def find_url():
    """APP_URL wins. Otherwise use index.html in the repo root, or in a habit-tracker/ subfolder."""
    url = os.environ.get("APP_URL")
    if url:
        return url
    for rel in ("index.html", "habit-tracker/index.html", "habit-tracker.html"):
        p = ROOT / rel
        if p.exists():
            return p.as_uri()
    raise SystemExit("Could not find index.html. Set APP_URL, for example APP_URL=file:///full/path/to/index.html")


def shot(name):
    SHOTS.mkdir(exist_ok=True)
    return str(SHOTS / name)


URL = find_url()
