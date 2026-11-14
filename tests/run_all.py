"""Runs every Life OS browser test and prints a summary. Exit code 1 if anything fails.

Usage:  python tests/run_all.py
Needs:  pip install playwright   and   playwright install chromium
"""
import subprocess, sys, pathlib

here = pathlib.Path(__file__).resolve().parent
suites = ["test_ui.py", "test_timer.py", "test_guide.py"]
failed = []
for s in suites:
    print("=" * 60 + "\n" + s + "\n" + "=" * 60, flush=True)
    r = subprocess.run([sys.executable, str(here / s)], text=True, capture_output=True)
    out = (r.stdout or "") + (r.stderr or "")
    print("\n".join(l for l in out.splitlines() if l.startswith(("FAIL", "TOTAL", "Traceback")) or "Error" in l))
    if r.returncode != 0:
        failed.append(s)
print()
print("ALL PASSED" if not failed else "FAILED: " + ", ".join(failed))
sys.exit(1 if failed else 0)
