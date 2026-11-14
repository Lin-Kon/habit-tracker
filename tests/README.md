# Browser tests for Life OS

These run the app in a real (headless) Chromium browser and check behavior the way a
person would use it: clicking tabs, ticking habits, running the timer, answering the
questionnaire, and so on. 129 checks across three files.

## One-time setup

```bash
pip install -r tests/requirements.txt
playwright install chromium
```

## Run everything

```bash
python tests/run_all.py
```

Prints a short summary per file and exits with code 1 if anything failed (handy for CI,
see `.github/workflows/tests.yml`).

## Run one file

```bash
python tests/test_ui.py       # tabs, calendar, reports, habit edit form, validation
python tests/test_timer.py    # start/pause/resume timer, time log, retention
python tests/test_guide.py    # questionnaire, plan, small steps, coach, rough day
```

Each prints `PASS`/`FAIL` per check and a `TOTAL x / y` line.

## Which file to open

By default the tests look for `index.html` in the repo root (or a `habit-tracker/`
subfolder, or `habit-tracker.html`), next to the `tests/` folder. To point at something
else — a URL you're hosting, or a different path — set `APP_URL`:

```bash
APP_URL="http://localhost:8080/" python tests/run_all.py
APP_URL="file:///full/path/to/index.html" python tests/run_all.py
```

## Screenshots

A few tests save screenshots to `tests/screenshots/` (gitignored) so you can look at what
the browser actually saw. They're not compared automatically — just there if a test fails
and you want to see why.

## When to run these

- After any change to the `.js` or `.css` files, before you consider the change done.
- `test_timer.py` and `test_guide.py` run in sequence and depend on earlier steps in the
  same file (for example, `test_timer.py` deliberately shrinks data retention partway
  through to test that path, which then affects a later check). Run whole files, not
  individual lines copy-pasted out of them.
- They take about a minute combined. `test_timer.py` especially waits on a couple of
  real timers (1-2 seconds) to check the clock display updates.

## Adding a check

Each file is plain Playwright + an `ok(name, condition, extra)` helper that appends a
pass/fail line to `res`. Add a new `ok(...)` call near the feature you're testing; there's
no special framework beyond that.
