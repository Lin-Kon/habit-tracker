/* badges.js: gamification. Badges are computed from your data; the date each was first earned is kept in settings.badges. */
function metrics() {
  const A = act(), t = TODAY(), m = { cycles: 0, total: 0, best: 0, bestW: 0, mins: 0, notes: 0, perfectRun: 0, perfectDays: 0, maxCats: 0, timeRun: 0, rate: 0, habits: habits.length, cats: new Set(habits.map(h => h.cat)).size };
  habits.filter(h => h.type !== "group").forEach(h => { m.total += totalDone(h); const L = longest(h); if (isWeekly(h)) m.bestW = Math.max(m.bestW, L); else m.best = Math.max(m.best, L); if (h.type === "time") m.timeRun = Math.max(m.timeRun, L); m.notes += Object.keys(h.notes).length; m.mins += [...new Set(Object.keys(h.done).concat(Object.keys(h.ent || {})))].reduce((a, d) => a + minsOf(h, d), 0) });
  habits.forEach(h => { if (h.type !== "group" && t > cycleEnd(h)) { const s = stats(h, winStart(h), cycleEnd(h)); if (pct(s.dn, s.el) >= 60) m.cycles++ } });
  if (A.length) {
    let run = 0;
    span(habits.map(h => h.created).sort()[0], t).forEach(d => {
      const s = dayStat(A, d); if (!s.t) return;
      if (s.n === s.t) { run++; m.perfectRun = Math.max(m.perfectRun, run); if (s.t >= 3) m.perfectDays++ } else run = 0;
      const cs = new Set(); A.forEach(h => { if (isDone(h, d)) cs.add(h.cat) }); m.maxCats = Math.max(m.maxCats, cs.size)
    });
    const f = addDays(t, -29), per = A.map(h => stats(h, f, t)), el = per.reduce((a, p) => a + p.el, 0);
    m.rate = el >= 30 ? pct(per.reduce((a, p) => a + p.dn, 0), el) : 0
  }
  return m
}
const BADGES = [
  { g: "Streaks", id: "s3", icon: "🔥", name: "Spark", desc: "3 days in a row on any habit", f: m => [m.best, 3] },
  { g: "Streaks", id: "s7", icon: "⚡", name: "On a roll", desc: "7 days in a row", f: m => [m.best, 7] },
  { g: "Streaks", id: "s14", icon: "🌟", name: "Fortnight", desc: "14 days in a row", f: m => [m.best, 14] },
  { g: "Streaks", id: "s30", icon: "🏅", name: "Month strong", desc: "30 days in a row", f: m => [m.best, 30] },
  { g: "Streaks", id: "s66", icon: "🧠", name: "Habit formed", desc: "66 days in a row, about the average time research found for a habit to feel automatic", f: m => [m.best, 66] },
  { g: "Streaks", id: "s100", icon: "💯", name: "Century", desc: "100 days in a row", f: m => [m.best, 100] },
  { g: "Streaks", id: "w4", icon: "📆", name: "Four-week run", desc: "Hit a days-per-week goal 4 weeks running", f: m => [m.bestW, 4] },
  { g: "Consistency", id: "pd", icon: "✅", name: "Perfect day", desc: "Finish every scheduled habit on a day with 3 or more", f: m => [m.perfectDays, 1] },
  { g: "Consistency", id: "pr3", icon: "🌈", name: "Triple perfect", desc: "3 perfect days in a row", f: m => [m.perfectRun, 3] },
  { g: "Consistency", id: "pr7", icon: "🏆", name: "Perfect week", desc: "7 perfect days in a row", f: m => [m.perfectRun, 7] },
  { g: "Consistency", id: "r80", icon: "🎯", name: "Steady 80", desc: "80% completion over the last 30 days", f: m => [m.rate, 80] },
  { g: "Volume", id: "v1", icon: "👣", name: "First step", desc: "Your first completed check-in", f: m => [m.total, 1] },
  { g: "Volume", id: "v50", icon: "🚶", name: "Getting going", desc: "50 completed check-ins", f: m => [m.total, 50] },
  { g: "Volume", id: "v250", icon: "🧱", name: "Committed", desc: "250 completed check-ins", f: m => [m.total, 250] },
  { g: "Volume", id: "v1000", icon: "🏛️", name: "Thousand club", desc: "1000 completed check-ins", f: m => [m.total, 1000] },
  { g: "Time invested", id: "t10", icon: "⏱️", name: "10 hours", desc: "10 hours logged in minute or hour habits", f: m => [Math.round(m.mins / 60), 10] },
  { g: "Time invested", id: "t50", icon: "🕰️", name: "50 hours", desc: "50 hours logged", f: m => [Math.round(m.mins / 60), 50] },
  { g: "Time invested", id: "t100", icon: "⌛", name: "100 hours", desc: "100 hours logged", f: m => [Math.round(m.mins / 60), 100] },
  { g: "Consistency", id: "cyc", icon: "🔄", name: "Full cycle", desc: "Finish a 66-day cycle with at least 60% completion", f: m => [m.cycles, 1] },
  { g: "Lifestyle", id: "bal", icon: "⚖️", name: "Balanced day", desc: "Complete habits in 4 different categories on one day", f: m => [m.maxCats, 4] },
  { g: "Lifestyle", id: "dot", icon: "⏰", name: "On the dot", desc: "Hit a time-of-day target 7 days in a row", f: m => [m.timeRun, 7] },
  { g: "Lifestyle", id: "ref", icon: "✍️", name: "Reflective", desc: "Write 10 daily notes", f: m => [m.notes, 10] },
  { g: "Lifestyle", id: "org", icon: "🗂️", name: "Organised", desc: "Track 5 habits across 3 categories", f: m => [Math.min(m.habits, 5) + Math.min(m.cats, 3), 8] }];
function badgeState() { const m = metrics(); return BADGES.map(b => { const [v, t] = b.f(m); return { ...b, v, t, ok: v >= t } }) }
function checkBadges(quiet) {
  const fresh = [];
  badgeState().forEach(b => { if (b.ok && !settings.badges[b.id]) { settings.badges[b.id] = TODAY(); fresh.push(b) } });
  if (fresh.length) { persist(); if (!quiet && typeof toast === "function") toast("🏆 Badge unlocked: " + fresh.map(b => b.icon + " " + b.name).join(", ")) }
}
