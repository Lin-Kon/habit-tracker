# Life OS: habit tracker

Static web app: no build step, no backend. Open `index.html` in a browser, or host the folder on any static host.

## Files (loaded in this order)
- `index.html`: page shell (header with Back and Forward, six tabs: Log, Calendar, Reports, Badges, Habits, Settings), loads the scripts.
- `styles.css`: all styling, light and dark themes via CSS variables.
- `core.js`: constants, date helpers, state, localStorage, and every rule: frequency (`isDue`), 66-day windows (`winStart`, `cycleEnd`, `inWin`), skips, sessions (`dayVal`, `setVal`, `setSlots`), groups (`kids`), done rules (`isDone`), streaks, stats, time spent (`minsOf`), deadlines (`behindList`), calendar limits (`bounds`), reordering (`reorderSubset`). No DOM access.
- `badges.js`: gamification. `metrics()`, the `BADGES` list, `checkBadges()`.
- `sample.js`, `templates.js`: sample-data generator and starter habit sets.
- `view-day.js`, `view-calendar.js`, `view-reports.js`, `view-habits.js`, `view-settings.js`, `view-badges.js`: one file per tab, each returns an HTML string.
- `ui.js`: `render()` and the navigation history (Back and Forward).
- `app.js`: click, change, submit, drag-to-reorder, notifications, first render.

Scripts share globals (no modules), so it also works when opened from disk.

## Data
localStorage key `habit-tracker-v1`: `{v:6, settings, cats:[{id,name,color,icon}], habits:[...]}`.
- settings: `weekStart`, `weekend`, `rollover` (hour a new day starts, default 4), `periods` (times of day: Late night, Morning, Afternoon, Evening, Night; contiguous, at least 30 minutes each), `notify`, `hideDone`, `collapsed`, `hcollapsed`, `badges`.
- habit: `{id, name, desc, icon, cat, parent, type:"yes"|"num"|"time"|"group", unit, mpu, target, freq, by, slots, need, color, created (start date), cycles, archived, done, skip, notes}`.
- Session habits store `done[date]` as `{slotId: value}`; everything else stores a plain value.
- Entries before the start date or after the window ends are kept but ignored and hidden.
- Optional timer: `h.timer`, entries in `h.ent[date]=[{t,d(seconds),man,c}]`, one running timer in `settings.run`. Minutes-based number habits take their day value from the entries; entries older than `settings.keepDays` (default 30) are merged into one daily total.
- Import, sample data and clear all write a snapshot to `habit-tracker-v1-backup` and offer Undo.

## Notes
- localStorage is per browser and per domain. Export JSON before moving hosts or clearing site data.
- Notifications only fire while the app is open. True background reminders need a service worker plus a push server.
- To publish as one file, inline the CSS and scripts into `index.html`.
