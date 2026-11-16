/* insights.js: extras layered on existing views by wrapping them (view-day, view-reports, view-habits, view-settings are unchanged):
   overlap report, timers timeline on the Log tab, habit views and sorting, "Supports objective" and "Can run in background" in the edit panel, pomodoro settings. */
/* ---- Reports: combinations of main and background */
function overlapSection() {
  const D = overlapData(rng), nm = id => { const h = habits.find(x => x.id === id); return h ? ic(h) + esc(h.name) : "(deleted)" };
  const pairs = Object.entries(D.pair).sort((a, b) => b[1] - a[1]);
  if (!pairs.length) return rsec("ov", "Combinations: main and background", '<p class="empty">No overlap yet. Start a background timer on the Home tab while a main timer runs, and the combinations appear here.</p>', false);
  const P = Object.keys(D.pWith).sort((a, b) => D.pWith[b] - D.pWith[a]), B = Object.keys(D.bTot).filter(b => pairs.some(x => x[0].endsWith("|" + b)));
  let body = '<h2 style="margin-top:0">Top combinations</h2>' + pairs.slice(0, 5).map(([k, m]) => { const [p, b] = k.split("|"); return '<div class="dl tl"><span>' + nm(p) + " + " + nm(b) + "</span><b>" + hmFmt(m) + "</b></div>" }).join("");
  body += "<h2>Main tasks: share of time with a background</h2>" + P.map(p => '<div class="dl tl"><span>' + nm(p) + "</span><b>" + Math.min(100, pct(D.pWith[p], D.pTot[p])) + "%</b></div>").join("");
  body += "<h2>Background habits: what you are usually doing</h2>" + B.map(b => { const top = pairs.filter(x => x[0].endsWith("|" + b)).slice(0, 3).map(x => nm(x[0].split("|")[0]) + " (" + hmFmt(x[1]) + ")").join(", "); return '<div class="dl tl"><span>' + nm(b) + '</span><b class="meta">' + top + "</b></div>" }).join("");
  return rsec("ov", "Combinations: main and background", body + '<p class="legend">Based on timers you ran live in the selected range. Manual entries are not included. Intervals are kept for 180 days.</p>', false, pairs.length)
}
const _rv = repView; repView = function () { return _rv() + (act().length ? overlapSection() : "") };
/* ---- Log: timeline of the day's timers, main above background */
function timelineHtml(d) {
  const E = []; habits.forEach(h => { if (h.type === "group") return; ((h.ent && h.ent[d]) || []).forEach(e => { if (e.t && !e.c) E.push({ h, e }) }) });
  if (!E.length) return "";
  const r = settings.rollover * 60, pos = t => (hm2m(t) - r + 1440) % 1440, bg = x => x.e.s === "b";
  const track = f => '<div class="trk">' + E.filter(x => bg(x) === f).map(x => { const p = pos(x.e.t); return '<i title="' + esc(x.h.name) + '" style="left:' + (p / 14.4) + "%;width:" + Math.max(.6, Math.min(1440 - p, x.e.d / 60) / 14.4) + "%;background:" + x.h.color + '"></i>' }).join("") + "</div>";
  const ax = [0, 6, 12, 18].map(k => "<span>" + pad2((settings.rollover + k) % 24) + ":00</span>").join("");
  E.sort((a, b) => pos(a.e.t) - pos(b.e.t));
  return "<h2>Timers this day</h2>" + '<div class="tline"><div class="meta">Main</div>' + track(false) + '<div class="meta">Background</div>' + track(true) + '<div class="axis">' + ax + "</div></div>"
    + E.map(x => '<div class="dl tl"><span><i class="dot" style="background:' + x.h.color + '"></i>' + esc(x.h.name) + ' <span class="meta">' + x.e.t + (bg(x) ? " · background" : "") + "</span></span><b>" + hmFmt(x.e.d / 60) + "</b></div>").join("")
}
const _dv = dayView; dayView = function () { return _dv() + timelineHtml(sel) };
/* ---- Habits: view modes and sorting (sorting only changes the order shown; the saved manual order is untouched) */
const HV_SORTS = [["manual", "Manual order"], ["az", "A to Z"], ["time", "Time of day"], ["spent", "Most time, last 30 days"], ["streak", "Best streak"], ["new", "Newest first"]];
const HV_MODES = [["list", "List"], ["cards", "Cards"], ["compact", "Compact"]];
function hvCmp(k) {
  const t = TODAY(), days = span(addDays(t, -29), t), by = nameSort;
  const tod = h => h.type === "time" && h.target ? tmin(h.target) : (periodOf(h.by) ? hm2m(periodOf(h.by).from) : 99999);
  return k === "az" ? by : k === "time" ? (a, c) => tod(a) - tod(c) || by(a, c) : k === "spent" ? (a, c) => days.reduce((s, d) => s + minsOf(c, d), 0) - days.reduce((s, d) => s + minsOf(a, d), 0) || by(a, c) : k === "streak" ? (a, c) => streak(c) - streak(a) || by(a, c) : (a, c) => (c.created || "").localeCompare(a.created || "") || by(a, c)
}
const _hv = habitsView;
habitsView = function () {
  if (reorder) return _hv();
  const hv = settings.hv, saved = habits; let html;
  if (hv.sort !== "manual") habits = saved.slice().sort(hvCmp(hv.sort));
  try { html = _hv() } finally { habits = saved }
  return '<div class="hvbar"><div class="rng">' + HV_MODES.map(([v, l]) => '<button class="tab" data-xhvm="' + v + '" aria-pressed="' + (hv.mode === v) + '">' + l + "</button>").join("") + '</div><select id="hvsort" aria-label="Sort habits">' + HV_SORTS.map(([v, l]) => '<option value="' + v + '"' + (hv.sort === v ? " selected" : "") + ">" + l + "</option>").join("") + '</select></div><div class="hv hv-' + hv.mode + '">' + html + "</div>"
};
/* ---- edit panel extras */
const objOpts = cur => gl().filter(g => g.obj.length).map(g => '<optgroup label="' + esc(g.name) + '">' + g.obj.map(o => '<option value="' + o.id + '"' + (o.id === cur ? " selected" : "") + ">" + esc(o.name) + "</option>").join("") + "</optgroup>").join("");
const _ep = editPanel;
editPanel = function (x) {
  const s = _ep(x); if (x.type === "group") return s;
  const id = 'data-id="' + x.id + '"', oo = objOpts(x.obj), bgOk = x.type !== "time" && !hasSlots(x);
  const html = (oo ? '<div><label class="note">Supports objective</label><select data-f="obj" ' + id + ' aria-label="Supports objective"><option value="">None</option>' + oo + "</select></div>" : "") + (bgOk ? '<div><label class="chkrow"><input type="checkbox" data-f="bg" ' + id + (x.bg ? " checked" : "") + "> Can run in background</label><p class=\"hint\">For things that play while you do something else, like a TV series or music. Shows up as a quick pick on Home.</p></div>" : "");
  return html ? s.replace('<details data-sec="ic', () => '<div class="cols">' + html + '</div><details data-sec="ic') : s
};
/* ---- Settings: pomodoro */
const _sv = settingsView;
settingsView = function () {
  const P = settings.pomo, n = (k, l, lo, hi) => '<label class="note">' + l + '</label><input type="number" data-xpset="' + k + '" min="' + lo + '" max="' + hi + '" value="' + P[k] + '">';
  return _sv() + '<details data-sec="pom"' + (openSec.pom ? " open" : "") + "><summary>Timers and pomodoro</summary><p class=\"note\">Pomodoro is switched on from the Home tab. A focus round is logged to your habit, then a break starts. Breaks are not logged.</p>" + n("focus", "Focus minutes", 5, 120) + n("short", "Short break minutes", 1, 60) + n("long", "Long break minutes", 5, 60) + n("every", "Long break after how many rounds", 2, 10) + '<label class="chkrow" style="margin-top:8px"><input type="checkbox" data-xpset="bgKeep"' + (P.bgKeep ? " checked" : "") + "> Keep the background timer running during breaks</label></details>"
};
