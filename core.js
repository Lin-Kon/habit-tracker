/* core.js: constants, date helpers, state, storage, rules (frequency, windows, skips, sessions, groups), streak and stats maths. No DOM access.
   Habit = {id,name,desc,icon,cat,parent,type:"yes"|"num"|"time"|"group",unit,mpu,target,freq,by,slots,need,color,created,cycles,archived,
            done:{date:value},skip:{date:1},notes:{date:text}}
   created = the habit's start date. Its window runs for 66 days x cycles. Nothing is shown or counted outside the window.
   freq = {t:"daily"} | {t:"weekdays"} | {t:"weekends"} | {t:"days",days:[0-6]} | {t:"weekly",n:1-7}
   slots = [{id,name,by}] for habits done several times a day; done[date] is then {slotId:value}.
   group = a parent habit; its sub-habits have parent = group id. A group is done when all its scheduled sub-habits are done. */
const KEY = "habit-tracker-v1", GOAL = 66, WINDOW = 66, PAL = ["#2f9e6e", "#3b82c4", "#8b5cf6", "#e0568a", "#e8833a", "#b7860b", "#14a3b8", "#7a8a99"];
const CAT_ICON = { "Study": "📚", "Work": "💼", "Self care": "🧘", "Health": "💪", "Entertainment": "🎬", "Other": "📌" };
const DEFAULT_CATS = [{ id: "study", name: "Study", color: "#3b82c4", icon: "📚" }, { id: "work", name: "Work", color: "#e8833a", icon: "💼" }, { id: "self", name: "Self care", color: "#8b5cf6", icon: "🧘" }, { id: "health", name: "Health", color: "#2f9e6e", icon: "💪" }, { id: "fun", name: "Entertainment", color: "#e0568a", icon: "🎬" }, { id: "other", name: "Other", color: "#7a8a99", icon: "📌" }];
const DEFAULT_PERIODS = [{ id: "latenight", name: "Late night", from: "00:00", to: "05:00" }, { id: "morning", name: "Morning", from: "05:00", to: "12:00" }, { id: "afternoon", name: "Afternoon", from: "12:00", to: "17:00" }, { id: "evening", name: "Evening", from: "17:00", to: "21:00" }, { id: "night", name: "Night", from: "21:00", to: "23:59" }];
const ICONS = ["📚", "✏️", "🧠", "💻", "💼", "🎯", "📝", "🧘", "🛏️", "⏰", "🍳", "🍽️", "💧", "🏃", "🏋️", "🚴", "🧹", "🎬", "📺", "🎮", "🎧", "📖", "🎨", "🛒", "🙏", "🌿", "💊", "🗓️", "🤝", "📨"];
const ICON_HINTS = [["english", "🔤"], ["bangla", "📖"], ["math", "➗"], ["science", "🔬"], ["affairs", "🌍"], ["question", "❓"], ["revision", "🔁"], ["wake", "⏰"], ["bed", "🛏️"], ["breakfast", "🍳"], ["lunch", "🍛"], ["dinner", "🍽️"], ["water", "💧"], ["exercise", "🏃"], ["run", "🏃"], ["tv", "📺"], ["movie", "🎬"], ["gaming", "🎮"], ["attend", "🏫"], ["homework", "📝"], ["journal", "📝"], ["practice", "✏️"], ["application", "📨"], ["network", "🤝"], ["skill", "🛠️"], ["cv", "📄"], ["interview", "🎤"], ["read", "📖"], ["meditat", "🧘"], ["deep work", "💻"], ["study", "📚"]];
const guessIcon = n => { n = n.toLowerCase(); const k = ICON_HINTS.find(([w]) => n.includes(w)); return k ? k[1] : "" };
const ds = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const parse = s => { const [a, b, c] = s.split("-").map(Number); return new Date(a, b - 1, c) };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ds(d) };
const TODAY = () => ds(new Date());
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (s, o) => parse(s).toLocaleDateString(undefined, o);
const span = (a, b) => { const r = []; for (let d = a; d <= b; d = addDays(d, 1))r.push(d); return r };
const r1 = n => Math.round(n * 10) / 10;
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const hm2m = s => { const [a, b] = s.split(":").map(Number); return a * 60 + b };
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes() };
/* Times before the "new day starts at" hour (default 04:00) count as late night of the SAME log day, i.e. after 24:00.
   So a 01:30 bedtime logged on Monday is later than 23:00 on Monday; Tuesday's 22:00 is logged on Tuesday. */
const tmin = v => { const [a, b] = v.split(":").map(Number), m = a * 60 + b; return m < settings.rollover * 60 ? m + 1440 : m };
const tstr = m => { m = Math.round(m) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0") };
let habits = [], cats = [], settings = { weekStart: 6, weekend: [5, 6], rollover: 4, notify: false, hideDone: false, collapsed: {}, hcollapsed: {}, badges: {}, periods: null, profile: null, plan: {}, reflections: {}, rough: {}, rest: {}, coachOn: true, promptSeen: false }, armed = null, view = "day", rng = 30, sel = TODAY(), repScope = "all", snap = null;
let calMode = "week", calScope = "all", calDate = TODAY(), calPick = null, editing = null, showNew = false, showOff = false, reorder = false, noteOpen = {}, openSec = {}, iconEdit = null, badgeQuiet = false;
// the load from localStorage runs at boot now
// try{const p=JSON.parse(localStorage.getItem(KEY));habits=Array.isArray(p)?p:(p&&p.habits)||[];if(p&&p.settings)Object.assign(settings,p.settings);if(p&&Array.isArray(p.cats))cats=p.cats}catch(e){habits=[]}
// if(!settings.v5){settings.weekStart=6;settings.v5=1}
/* ---- validation helpers (names must be unique; times of day must follow each other without gaps or overlaps) */
const PMIN = 30;
const normName = s => String(s).trim().replace(/\s+/g, " ").toLowerCase();
const habitNameTaken = (n, exceptId) => habits.find(h => h.id !== exceptId && normName(h.name) === normName(n));
const catNameTaken = (n, exceptId) => cats.find(c => c.id !== exceptId && normName(c.name) === normName(n));
const nameMsg = (n, dup) => "“" + n.trim() + "” is already used by another " + (dup.type === "group" ? "group" : "habit") + (dup.archived ? " (archived)" : "") + ". Habit and group names must be different, otherwise reports and the calendar would be confusing.";
function slotNamesError(names) {
  if (names.length === 1) return "Add at least two session names, or leave the box empty for a habit done once a day.";
  const seen = {}; for (const n of names) { const k = normName(n); if (seen[k]) return "Session names must be different: “" + n + "” is used twice."; seen[k] = 1 }
  return ""
}
function fixTo() { const P = settings.periods; P.forEach((p, i) => { p.to = i < P.length - 1 ? P[i + 1].from : "23:59" }) }
function fixPeriods() {
  let P = Array.isArray(settings.periods) ? settings.periods.filter(p => p && p.id && p.name && /^\d\d:\d\d$/.test(p.from || "")) : [];
  if (P.length && !P.some(p => p.id === "latenight")) P = [{ id: "latenight", name: "Late night", from: "00:00" }].concat(P.filter(p => p.from !== "00:00"));
  P.sort((a, b) => hm2m(a.from) - hm2m(b.from));
  const names = new Set(P.map(p => normName(p.name)));
  const ok = P.length >= 2 && P[0].from === "00:00" && names.size === P.length && P.every((p, i) => i === 0 || hm2m(p.from) - hm2m(P[i - 1].from) >= PMIN) && hm2m("23:59") - hm2m(P[P.length - 1].from) >= PMIN;
  settings.periods = ok ? P : DEFAULT_PERIODS.map(p => ({ ...p })); fixTo()
}
function periodStartError(i, v) {
  const P = settings.periods; if (i === 0) return "Late night always starts at 00:00.";
  const lo = hm2m(P[i - 1].from) + PMIN, hi = (i < P.length - 1 ? hm2m(P[i + 1].from) : hm2m("23:59")) - PMIN, m = hm2m(v);
  if (m < lo || m > hi) return P[i].name + " must start between " + tstr(lo) + " and " + tstr(hi) + ": after " + P[i - 1].name + " has been running at least " + PMIN + " minutes, and " + (i < P.length - 1 ? "at least " + PMIN + " minutes before " + P[i + 1].name + " starts" : "before the day ends") + ". Periods can’t overlap or leave gaps.";
  return ""
}
function periodNameError(i, v) {
  if (!v) return "A period needs a name.";
  const dup = settings.periods.find((p, j) => j !== i && normName(p.name) === normName(v));
  return dup ? "“" + v + "” is already used by another time of day. Names must be different." : ""
}
const daysLeft = h => dayDiff(TODAY(), cycleEnd(h));
const nearEnd = h => h.type !== "group" && !h.archived && h.created <= TODAY() && daysLeft(h) <= 14;
function norm() {
  ["collapsed", "hcollapsed", "badges", "plan", "reflections", "rough", "rest"].forEach(k => settings[k] = settings[k] || {});
  settings.a11y = Object.assign({ contrast: false, motion: "auto", text: 100 }, settings.a11y);
  if (!Array.isArray(settings.weekend)) settings.weekend = [5, 6];
  fixPeriods();
  if (typeof settings.rollover !== "number") settings.rollover = 4;
  if (!cats.length) cats = DEFAULT_CATS.map(c => ({ ...c }));
  cats.forEach(c => { if (c.icon === undefined) c.icon = CAT_ICON[c.name] || "📁" });
  habits.forEach((h, i) => {
    h.type = h.type || "yes"; h.done = h.done || {}; h.notes = h.notes || {}; h.color = h.color || PAL[i % PAL.length]; h.created = h.created || TODAY();
    if (!h.cycles) h.cycles = Math.max(1, Math.ceil((dayDiff(h.created, TODAY()) + 1) / WINDOW));
    if (!cats.some(c => c.id === h.cat)) h.cat = cats[cats.length - 1].id
  });
  if (typeof settings.keepDays !== "number") settings.keepDays = 30;
  if (settings.run && !habits.some(h => h.id === settings.run.id)) settings.run = null;
  compactEntries()
}
// const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({v:6,settings,cats,habits}))}catch(e){}};
let persistFailed = false;
const persist = () => persistState({ v: 6, settings, cats, habits });
// const persist=()=>{
//   try{if(typeof syncStamp==="function")syncStamp()}catch(e){}
//   try{localStorage.setItem(KEY,JSON.stringify({v:6,settings,cats,habits}));persistFailed=false;return true}
//   catch(e){if(!persistFailed&&typeof toast==="function")toast("Could not save: browser storage is full or blocked. Export a backup now.");persistFailed=true;return false}};
const save = () => { persist(); if (typeof checkBadges === "function") checkBadges(badgeQuiet) };
const act = () => habits.filter(h => !h.archived);
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const wdOrder = () => [0, 1, 2, 3, 4, 5, 6].map(i => (i + settings.weekStart) % 7);
const catOf = id => cats.find(c => c.id === id) || cats[cats.length - 1];
const weekStartOf = d => addDays(d, -((parse(d).getDay() - settings.weekStart + 7) % 7));
const weekOf = d => { const s = weekStartOf(d); return span(s, addDays(s, 6)) };
const periodOf = id => settings.periods.find(p => p.id === id);
const guessPeriod = n => { const p = settings.periods.find(x => x.name.toLowerCase() === String(n).toLowerCase() || x.id === String(n).toLowerCase()); return p ? p.id : "" };
/* ---- groups, windows (66-day cycles), skips, sessions */
const kids = g => habits.filter(c => c.parent === g.id && !c.archived);
const winStart = h => h.type === "group" ? (kids(h).map(k => k.created).sort()[0] || h.created) : h.created;
const cycleEnd = h => h.type === "group" ? (kids(h).map(k => cycleEnd(k)).sort().pop() || addDays(h.created, WINDOW - 1)) : addDays(h.created, WINDOW * (h.cycles || 1) - 1);
const inWin = (h, d) => d >= winStart(h) && d <= cycleEnd(h);
const dayNo = (h, d) => dayDiff(h.created, d) + 1;
const vis = (h, d) => h.type === "group" ? kids(h).some(k => vis(k, d)) : !h.archived && inWin(h, d);
const hasSlots = h => (h.type === "yes" || h.type === "num") && Array.isArray(h.slots) && h.slots.length > 1;
const skipped = (h, d) => !!(h.skip && h.skip[d]);
/* Value for a day: raw value, or for session habits the number of sessions done (yes) or the total (num). */
function dayVal(h, d) { if (tmValue(h) && h.ent && h.ent[d] && h.ent[d].length) return r2(entMins(h, d) / unitMins(h)); const v = h.done[d]; if (!hasSlots(h)) return v; if (!v || typeof v !== "object") return 0; let t = 0; h.slots.forEach(s => { const x = v[s.id]; if (x) t += h.type === "num" ? x : 1 }); return t }
function setVal(h, d, slot, v) {
  if (slot) { let o = h.done[d]; if (!o || typeof o !== "object") o = {}; if (v) o[slot] = v; else delete o[slot]; if (Object.keys(o).length) h.done[d] = o; else delete h.done[d] }
  else { if (v) h.done[d] = v; else delete h.done[d] }
  if (v && h.skip) delete h.skip[d]
}
/* Turn a once-a-day habit into a several-times-a-day habit (or back) without losing data. */
function setSlots(h, names) {
  const old = h.slots || [];
  if (names.length < 2) {
    if (old.length) { Object.keys(h.done).forEach(d => { const v = h.done[d]; if (v && typeof v === "object") { const t = h.type === "num" ? Object.values(v).reduce((a, b) => a + b, 0) : (Object.keys(v).length ? 1 : 0); if (t) h.done[d] = t; else delete h.done[d] } }); delete h.slots; delete h.need }
    return
  }
  const mk = (n, i) => old[i] ? { id: old[i].id, name: n, by: old[i].by } : { id: "s" + i + Date.now().toString(36), name: n, by: guessPeriod(n) };
  const next = names.map(mk);
  if (!old.length) Object.keys(h.done).forEach(d => { const v = h.done[d]; if (v && typeof v !== "object") h.done[d] = { [next[0].id]: v } });
  h.slots = next; if (h.need > next.length) h.need = next.length
}
/* ---- frequency */
const freq = h => h.freq || { t: "daily" };
const isWeekly = h => freq(h).t === "weekly";
function isDue(h, d) {
  if (h.type === "group") return kids(h).some(c => !isWeekly(c) && isDue(c, d));
  if (!isWeekly(h) && skipped(h, d)) return false;
  if (!inWin(h, d)) return false;
  const f = freq(h), w = parse(d).getDay();
  if (f.t === "weekdays") return !settings.weekend.includes(w);
  if (f.t === "weekends") return settings.weekend.includes(w);
  if (f.t === "days") return (f.days || []).includes(w);
  return true
}
/* Counts toward a day's totals when scheduled that day (days-per-week habits only when done). Groups never count (their sub-habits do). */
const dueOn = (h, d) => h.type === "group" ? false : inWin(h, d) && (isWeekly(h) ? isDone(h, d) : isDue(h, d));
const freqLabel = h => { const f = freq(h); return f.t === "weekdays" ? "Weekdays" : f.t === "weekends" ? "Weekends" : f.t === "weekly" ? (f.n || 1) + ((f.n || 1) === 1 ? " day" : " days") + " per week" : f.t === "days" ? (wdOrder().filter(w => (f.days || []).includes(w)).map(w => WD[w]).join(", ") || "No days") : "Every day" };
/* ---- done rules */
function isDone(h, d) {
  if (h.type === "group") { const L = kids(h).filter(c => !isWeekly(c) && isDue(c, d)); return L.length > 0 && L.every(c => isDone(c, d)) }
  const v = dayVal(h, d);
  if (h.type === "num") return v > 0 && (!h.target || v >= (h.tiny > 0 && h.tiny < h.target ? h.tiny : h.target));
  if (h.type === "time") return !!v && (!h.target || tmin(v) <= tmin(h.target));
  return hasSlots(h) ? v >= (h.need || h.slots.length) : !!v
}
const logged = (h, d) => h.type === "group" ? isDone(h, d) : h.type === "time" ? !!h.done[d] : dayVal(h, d) > 0;
function doneKeys(h) {
  if (h.type === "group") { const e = cycleEnd(h), t = TODAY(); return span(winStart(h), e < t ? e : t).filter(d => isDone(h, d)) }
  return [...new Set(Object.keys(h.done).concat(Object.keys(h.ent || {})))].filter(d => inWin(h, d) && isDone(h, d))
}
const totalDone = h => doneKeys(h).length;
const weekDone = (h, d) => weekOf(d).filter(x => isDone(h, x)).length;
const earliest = h => Object.keys(h.done).concat(Object.keys(h.ent || {})).concat(winStart(h)).sort()[0];
function nextDue(h, d) { for (let i = 1; i <= 7; i++) { const x = addDays(d, i); if (isDue(h, x)) return x } return null }
/* Streak: consecutive scheduled days done (unscheduled and skipped days are skipped over); for days-per-week habits, consecutive weeks meeting the goal. */
function streak(h) {
  const t = TODAY(), lim = earliest(h); let n = 0;
  if (isWeekly(h)) { const N = freq(h).n || 1; if (weekDone(h, t) >= N) n++; let ws = addDays(weekStartOf(t), -7); while (ws >= weekStartOf(lim) && weekDone(h, ws) >= N) { n++; ws = addDays(ws, -7) } return n }
  let d = t; if (isDue(h, t) && !isDone(h, t)) d = addDays(t, -1);
  while (d >= lim) { if (isDue(h, d)) { if (isDone(h, d)) n++; else break } d = addDays(d, -1) }
  return n
}
function longest(h) {
  const keys = doneKeys(h).sort(); if (!keys.length) return 0;
  let best = 0, run = 0, prev = null;
  if (isWeekly(h)) {
    const N = freq(h).n || 1, wk = {}; keys.forEach(d => { const k = weekStartOf(d); wk[k] = (wk[k] || 0) + 1 });
    Object.keys(wk).filter(k => wk[k] >= N).sort().forEach(k => { run = prev && addDays(prev, 7) === k ? run + 1 : 1; best = Math.max(best, run); prev = k }); return best
  }
  keys.forEach(d => { run = prev && nextDue(h, prev) === d ? run + 1 : 1; best = Math.max(best, run); prev = d }); return best
}
/* stats: el = scheduled days (or weekly targets), dn = how many were met, days = every day in range inside the window, due = scheduled days. */
function stats(h, from, to) {
  const e = cycleEnd(h), ws = winStart(h); if (to > e) to = e;
  const s = ws > from ? ws : from; if (s > to) return { el: 0, dn: 0, days: [], due: [] };
  const days = span(s, to);
  if (!isWeekly(h)) { const due = days.filter(d => isDue(h, d)); return { el: due.length, dn: due.filter(d => isDone(h, d)).length, days, due } }
  const N = freq(h).n || 1, t = TODAY(), segs = {}; let el = 0, dn = 0;
  days.forEach(d => { const k = weekStartOf(d); (segs[k] = segs[k] || []).push(d) });
  Object.keys(segs).forEach(k => {
    const seg = segs[k], done = seg.filter(d => isDone(h, d)).length, wEnd = addDays(k, 6);
    if (k <= t && wEnd >= t && to >= t) { if (done >= N) { el += N; dn += N } else if (done + span(t, wEnd).length < N) { el += N; dn += done } }
    else { const tg = Math.min(N, seg.length); el += tg; dn += Math.min(tg, done) }
  });
  return { el, dn, days, due: days }
}
function dayStat(list, d) { let n = 0, t = 0; if (d > TODAY()) return { n, t }; list.forEach(h => { if (dueOn(h, d)) { t++; if (isDone(h, d)) n++ } }); return { n, t } }
function timeStats(h, days) { const v = days.filter(d => h.done[d]).map(d => tmin(h.done[d])); return v.length ? { n: v.length, avg: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v) } : null }
/* Time spent. A number habit counts if its unit is minutes or hours, or if "minutes per unit" (mpu) is set (e.g. 40 per TV episode).
   A yes/no habit counts mpu minutes per completed check-in. Time-of-day habits and groups are never counted. */
const unitMins = h => { const u = (h.unit || "").toLowerCase(); return /^min/.test(u) ? 1 : /^(h$|hr|hour)/.test(u) ? 60 : 0 };
const isTimed = h => h.timer ? true : h.type === "yes" ? h.mpu > 0 : h.type === "num" ? (unitMins(h) > 0 || h.mpu > 0) : false;
const minsOf = (h, d) => { if (h.type === "group" || h.type === "time" || !inWin(h, d)) return 0; if (h.timer) { const E = entMins(h, d); if (E > 0) return E } const v = dayVal(h, d) || 0; if (h.type === "yes") return h.mpu > 0 ? v * h.mpu : 0; const u = unitMins(h); return u ? v * u : (h.mpu > 0 ? v * h.mpu : 0) };
/* ---- time-of-day deadlines ("finish by the end of the morning") */
function behindList() {
  const t = TODAY(), now = nowMin(), out = [];
  act().forEach(h => {
    if (h.type === "group" || isWeekly(h) || !vis(h, t) || !isDue(h, t) || isDone(h, t)) return;
    if (hasSlots(h)) { const v = h.done[t] || {}; h.slots.forEach(s => { const p = periodOf(s.by); if (p && hm2m(p.to) < now && !v[s.id]) out.push({ h, slot: s, p }) }) }
    else { const p = periodOf(h.by); if (p && hm2m(p.to) < now) out.push({ h, p }) }
  });
  return out
}
/* ---- calendar browsing limits: 3 months ahead; back to one month before the earliest record (a start date or a logged entry) */
function monthShift(ym, k) { const [y, m] = ym.split("-").map(Number); return ds(new Date(y, m - 1 + k, 1)).slice(0, 7) }
function bounds() {
  const t = TODAY(); let first = t;
  habits.forEach(h => { [h.created].concat(Object.keys(h.done)).concat(Object.keys(h.ent || {})).forEach(x => { if (x < first) first = x }) });
  const min = monthShift(first.slice(0, 7), -1) + "-01", max = addDays(monthShift(t.slice(0, 7), 4) + "-01", -1);
  return { min, max, minYM: min.slice(0, 7), maxYM: max.slice(0, 7) }
}
/* Put a subset of habits (by id) in a new relative order, leaving all other habits where they are. */
function reorderSubset(ids) {
  const pos = []; habits.forEach((h, i) => { if (ids.includes(h.id)) pos.push(i) });
  const ord = ids.map(id => habits.find(h => h.id === id)).filter(Boolean);
  pos.forEach((p, k) => { habits[p] = ord[k] })
}
/* ---- optional timer: start, pause, resume and manual entries.
   h.timer = true turns it on. h.ent[date] = [{t:"HH:MM" start (or ""), d:seconds, man:1 if typed, c:1 if merged}].
   Minutes-based number habits take their day value from the entries; other habits only gain time information.
   Entries with start times are kept for settings.keepDays (default 30); older ones are merged into one daily total. settings.run = {id, at} while a timer runs. */
function pad2(n) { return String(n).padStart(2, "0") }
function r2(n) { return Math.round(n * 100) / 100 }
function entMins(h, d) { return ((h.ent && h.ent[d]) || []).reduce((a, e) => a + e.d, 0) / 60 }
function tmValue(h) { return !!h.timer && h.type === "num" && !hasSlots(h) && unitMins(h) > 0 }
function keepDays() { return settings.keepDays || 30 }
function fmtClock(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 3600) + ":" + pad2(Math.floor(s % 3600 / 60)) + ":" + pad2(s % 60) }
function compactEntries() {
  const lim = addDays(TODAY(), -keepDays());
  habits.forEach(h => {
    if (!h.ent) return; Object.keys(h.ent).forEach(d => {
      const es = h.ent[d];
      if (!es || !es.length) { delete h.ent[d]; return }
      if (d < lim && !(es.length === 1 && es[0].c)) h.ent[d] = [{ t: "", d: es.reduce((a, e) => a + e.d, 0), c: 1 }]
    })
  })
}
function addEntry(h, d, e) {
  h.ent = h.ent || {}; const cur = h.ent[d] || (h.ent[d] = []);
  if (!cur.length && tmValue(h) && h.done[d] > 0) { cur.push({ t: "", d: Math.round(h.done[d] * unitMins(h) * 60), man: 1 }); delete h.done[d] }
  cur.push(e); cur.sort((a, b) => (a.t || "").localeCompare(b.t || ""));
  if (h.type === "yes" && !h.done[d] && e.d >= 60) h.done[d] = 1;
  if (h.skip) delete h.skip[d]
}
function runStart(h) { settings.run = { id: h.id, at: Date.now() } }
function runH() { return settings.run ? habits.find(h => h.id === settings.run.id) : null }
function runStop() {
  const r = settings.run; if (!r) return null; settings.run = null;
  const h = habits.find(x => x.id === r.id); if (!h) return null;
  const secs = Math.max(1, Math.round((Date.now() - r.at) / 1000)), s = new Date(r.at);
  addEntry(h, ds(s), { t: pad2(s.getHours()) + ":" + pad2(s.getMinutes()), d: secs }); compactEntries(); return { h, secs }
}
/* ---- small steps: a number habit can have a small step (h.tiny). Reaching it counts as done and keeps the streak; reaching the full goal is tracked separately. */
function isFull(h, d) { if (h.type !== "num" || !(h.tiny > 0)) return isDone(h, d); const v = dayVal(h, d); return v > 0 && (!h.target || v >= h.target) }
function isSmall(h, d) { return h.type === "num" && h.tiny > 0 && isDone(h, d) && !isFull(h, d) }
/* ---- rest day: leave every scheduled habit out of today's totals (streaks are protected) */
function restDay() { const t = TODAY(), ids = []; act().forEach(h => { if (h.type === "group" || isWeekly(h) || !vis(h, t) || !isDue(h, t) || isDone(h, t)) return; h.skip = h.skip || {}; h.skip[t] = 1; ids.push(h.id) }); settings.rest[t] = ids; return ids.length }
function undoRest() { const t = TODAY(); (settings.rest[t] || []).forEach(id => { const h = habits.find(x => x.id === id); if (h && h.skip) delete h.skip[t] }); delete settings.rest[t] }
