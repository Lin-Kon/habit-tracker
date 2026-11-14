# Life OS: Product Specification

> See `README.md` for the file layout and how the app is built; this document describes behavior and rules from a user's point of view.

*A personal habit and activity tracker for study, work, health and everyday life. This document describes what the app does, how it counts things, and the rules and limits you will meet.*

This is a plain-text copy of the specification, kept in the repo for reference. The formatted version (with colour-coded boxes for New, Changed, Fixed and Planned items) is the linked doc at the top of the project README — open that one if you want the colour. Small one-row tables below (`| NEW: ... |`) mark the same callouts here in plain Markdown; everything else renders the same.

| New | Changed | Fixed | Planned |
| --- | --- | --- | --- |
| A feature added in this version | Behaviour that now works differently | A problem that has been corrected | Not available yet, planned for a later version |

## What's new in this version

| Type | What changed | Where |
| --- | --- | --- |
| New | Late night (12 am to 5 am) joins Morning, Afternoon, Evening and Night as a time of day. | Section 11 |
| New | Times of day are checked: no gaps or overlaps, at least 30 minutes each, unique names, and a reason is shown when a change is blocked. | Section 11 |
| New | Names must be unique for habits and groups, for categories, for sessions within a habit, and for times of day. | Section 15 |
| New | The habit edit panel uses columns: Category beside Part of group, Unit beside Daily goal, How often beside Finish by. | Section 4, Habits |
| New | The 66-day cycle line, the warning label and Add 66 more days show only in the last 14 days of a cycle and after it ends. | Section 7 |
| New | The Calendar shows group names: group rows in the week grid, groups in the day detail, and a group choice in the menu. | Section 4, Calendar |
| New | Reports has Summary and Details sections. By category, By group and By habit fold open and closed, and a group can be reported on its own. | Section 4, Reports |
| Changed | The start date is set once when a habit is added, from 7 days before to 7 days after today, and can't be edited afterwards. | Section 13 |
| Changed | Session names must be different within a habit, and a single session name is not accepted. | Section 8 |
| Fixed | Session names in the edit panel were squeezed to one letter beside the deadline menu. Each session now has its own line. | Section 8 |
| Fixed | The tick circles in the Log stay perfectly round in every row layout, with or without a deadline. | Section 4, Log |
| Fixed | The Finish by menu uses short labels that fit in a half-width column. | Section 11 |
| Planned | Editing a habit's start date after it has been created. | Sections 13 and 18 |
| Planned | Sleep duration from bedtime and wake-up times, and a titled movie and TV library. | Section 18 |

**Latest update: optional timer and time log.**

| Type | What changed | Where |
| --- | --- | --- |
| New | An optional timer for any yes or no or number habit: Start, Pause and Resume, with a bar showing the running habit on every tab. | Section 20 |
| New | A time log with manual entries and editable start times and minutes, for a forgotten start or pause. | Section 20 |
| New | When you spend timed minutes: Reports show minutes by time of day, placed by each entry's start time. | Section 20 |
| New | A setting for how long detailed entries are kept (7, 30, 66 or 90 days, default 30). Older entries merge into daily totals. | Section 20 |
| Changed | Time spent in Reports and badges uses timer minutes first for habits that have a timer. | Section 14 |

**Latest update: personal guidance and small steps.**

| Type | What changed | Where |
| --- | --- | --- |
| New | An optional questionnaire (age range, life situation, what you want help with, a few optional extras, and how you like to be spoken to) personalises the app. | Section 21 |
| New | A library of small suggested steps matched to your age range and situation, each added to your habits with one tap. | Section 21 |
| New | Small steps: a habit can have a smaller version that counts as done and keeps your streak, while the full goal is still tracked. | Section 21 |
| New | Coach notes and encouraging messages, a weekly note on how you are doing, and a space for your own reflection. | Section 21 |
| New | Rough day: small steps only, or a rest day that protects your streaks. | Section 21 |
| Changed | The Badges tab is now part of a new Guide tab. | Section 4 |
| Fixed | Settings sections that you open now stay open when the screen refreshes quickly. | Section 4 |

## 1. What Life OS is

Life OS helps you record what you do each day and see where your time and effort go. You decide what to track, how often, and how it is measured. The app then shows your day, your calendar, your trends, your time spent, and rewards you for consistency.

It works in a web browser on a phone or computer. Your data stays on your own device. There is no account, no sign-up and no server.

## 2. Who it is for

- **Students and exam candidates.** Track subjects, study minutes, questions solved and revision, with deadlines such as "finish English grammar by the morning". A ready-made BCS preparation template is included.
- **Job seekers.** Track applications sent, networking, skill practice and interview preparation.
- **Anyone building a routine.** Track sleep and wake times, meals, water, exercise, reading, and entertainment such as TV episodes and movies.
- **People who like detail.** Every habit can have a description, daily notes, a start date and its own schedule.

## 3. Key ideas

- **Habit.** Something you want to do or record. Each habit has a type, a category, a schedule and a start date.
- **Category.** A heading that groups habits, for example Study, Work, Self care, Health and Entertainment. You can rename, recolour, reorder and add your own.
- **Group.** A habit that contains sub-habits, such as "BCS English" containing grammar and literature.
- **Sessions.** A way to record one habit several times in a day, such as water in the morning, afternoon and night.
- **Scheduled day.** A day on which a habit is expected, based on its schedule. Only scheduled days count for or against you.
- **Skip.** A day you choose to leave out on purpose, without penalty.
- **Cycle.** A habit appears for 66 days at a time. You can add another 66 days whenever you like.
- **Deadline.** An optional time of day by which a habit should be finished, for example by the end of the morning.

## 4. The six tabs

### Log

The Log is where you record each day.

- Use the arrows to move between days. Tap **Back to today** to return.
- Habits are listed under their category. Tap a category heading to fold it away, and use **Hide done** to show only what is left to do.
- Each habit has a control that matches its type: a tick, a number box, or a time box. Tap **More** on a habit to see its details, add a note for that day, or skip the day.
- At the top you may see a **Behind schedule** banner for habits whose deadline has passed, and a note when a habit has finished its 66-day cycle.
- Habits that are not scheduled for the chosen day are hidden. A line at the bottom tells you how many, with a link to show them.

### Calendar

The Calendar has two layouts, chosen with the **Week** and **Month** buttons, and a menu to show all categories, one category, one group, or one habit.

- **Week** is a detailed grid. Each row is a habit, grouped under its category, and each column is a day. Cells show what you logged (a tick, a number, or a time). Beside each category you see how many of its habits were done that day, for example 2/3. Tap a cell to open that day in the Log.
- **Month** is an overview. In the all-categories view each day shows one dot per category: filled when every habit in that category was done, faded when some were, and a ring when none were. Shading shows overall completion. In a category view each dot is one habit. In a single-habit view each day shows the value you logged. Tap a day to see a summary, with a button to open it.

The calendar only shows a habit during its own 66-day cycle, so you never scroll into months that belong to a habit far in the future.

| NEW: group names in the calendar |
| --- |
| In the week grid each group appears as its own row under its category, showing how many of its sub-habits were done each day (for example 2/2), with its sub-habits listed beneath it. In the month view, choose a group from the menu to see its sub-habits as dots, or tap any day to see its categories and groups by name. |

### Reports

Reports summarise your results. Choose a scope from the menu: **Combined** (all habits), a **category**, a **group**, or a **single habit**. Choose a range: 7 days, 30 days, 90 days or all time. The page has two collapsible sections, **Summary** and **Details**.

- Overview cards: completion rate, habit-days done, best current streak and longest streak.
- **Where your time goes:** a bar and list showing hours by category (or by habit when a category is chosen).
- **By category** and **By habit** rows with a progress bar, streak and a Details button at the right of each name that opens that item's own report.
- A 12-week completion chart and a **by day of the week** chart, so you can see which weekdays you tend to miss.
- For a single habit: totals and averages for number habits, average, earliest and latest times for time habits, days skipped, its description, and your recent notes.

| NEW: Summary and Details sections |
| --- |
| Summary holds the overview cards, where your time goes, the 12-week completion chart and the by-day-of-week chart. Details holds By category, By group and By habit. Each of these folds open and closed, and every row has its Details button at the right end of the name line, so rows stay compact. Choosing a group in the menu reports on the group and lists its sub-habits. |

### Guide (includes the badges)

Badges reward consistency. The Badges section of the Guide tab shows your level, your XP, and every badge with either its earned date or your progress towards it. See section 14 for the rules.

| NEW: the Guide tab |
| --- |
| The Badges tab is now the Guide tab. It holds four sections: Today, My plan, This week and Badges. Until you answer the optional questionnaire it shows an invitation to take it, with the badges below. See section 21. |

### Habits

This is where you manage your list.

- Add a habit with **+ New habit**. After you add it, its edit panel opens so you can set the schedule, sessions, deadline and more.
- Habits are shown in compact rows under collapsible category headings. Tap **Edit** on a row to open its panel. Use **Collapse all** and **Expand all** to save scrolling.
- **Reorder** lets you drag categories and habits into the order you want. See section 15.
- Archive a habit to hide it without losing its history, or delete it to remove it and its data.

| NEW: tidier edit panel |
| --- |
| The edit panel is arranged in columns. Category is on the left and Part of group on the right. If no groups exist the right side stays empty, and a habit that belongs to a group shows its category greyed out because it follows the group. Unit sits beside Daily goal, and How often sits beside Finish by. The start date is not shown in the edit panel. |

### Settings

Settings are grouped into sections that open and close: Templates, Categories, Times of day, Preferences, Reminders, Backup and restore, Testing, and Rules and limits.

## 5. Habit types

- **Yes or no.** You tick it when done.
- **A number.** You enter an amount, for example 45 minutes, 8 glasses, 20 pages or 3 episodes. You can set a daily goal. With a goal, the day counts as done when you reach it. Without a goal, any amount above zero counts.
- **A time of day.** You enter a clock time, such as when you woke up, went to bed or ate. You can set an "on or before" time. The day counts as done when you log a time at or before it. When you are late, the Log shows by how much.
- **A group.** A parent for sub-habits. It has no entry of its own. See section 9.

Every habit can also have a **description** (for example "finish one grammar chapter or 25 questions"), shown when you tap More in the Log and at the top of its report.

## 6. How often

Each habit has a schedule:

- **Every day.**
- **Weekdays** or **Weekends.** Which days count as the weekend is a setting. It starts as Friday and Saturday, and you can change it to Saturday and Sunday or Friday only.
- **Specific days.** You pick the days of the week, for example Sunday, Tuesday and Thursday.
- **Days per week.** You choose a number from 1 to 7, for example four workouts a week on any days.

On days a habit is not scheduled it is hidden from the Log, does not count against you, and does not break your streak.

**How days-per-week habits are counted.** These habits are measured by the week, not the day. A week is met when you reach your number. Completion is calculated as weeks met against weeks expected. The week in progress is not counted as a miss until it is no longer possible to reach the goal. If a habit starts part-way through a week, that first week's target is reduced to the days left. Streaks for these habits are counted in weeks. Days-per-week habits do not use skip days or finish-by deadlines, because they do not have fixed days.

## 7. The 66-day cycle

Research on habit formation found that a new habit took about 66 days on average to feel automatic, with a wide range between people. Life OS uses 66 days as its natural unit.

- Every habit has a start date. It appears in the Log and Calendar from that date for 66 days.
- When the cycle ends, the habit stops appearing for new days. For a week afterwards the Log reminds you and offers **Add 66 more days**. You can also extend from the habit's edit panel during its last 14 days or after it ends, as many times as you like.
- Before the start date and after the cycle ends, nothing is shown or counted for that habit. Entries you made are kept, and become visible again if you move the start date or extend the cycle.
- A **Full cycle** badge rewards finishing a cycle with at least 60% completion.

| UPDATED: when the cycle line is shown |
| --- |
| To keep the screen tidy, the line such as "Day 57 of 66. The habit appears until 5 Dec 2026. Add 66 more days" appears in a habit's edit panel only when 14 days or fewer remain, or after the cycle has ended. It comes with a warning label such as "Ends in 9 days". The Habits list shows the same warning label and an Add 66 days link only for those habits. Habits with a long time left show nothing. |

A 66-day cycle is a guide, not a pass or fail mark. A missed day does not reset anything.

## 8. Several times a day (sessions)

Some habits happen more than once a day. In the habit's edit panel, type session names separated by commas, for example **Morning, Afternoon, Night**. The Log then shows one small control per session.

- **Yes or no habits** show a tick per session. You choose how many sessions are needed for the day to count (all of them by default).
- **Number habits** show a number box per session. The sessions are added together and compared with the daily goal. For example, 3 + 2 + 3 glasses of water is 8, which meets a goal of 8.
- Each session can have its own deadline. Naming a session Late night, Morning, Afternoon, Evening or Night sets that deadline automatically.
- You can add sessions to an existing habit. What you had already recorded is moved into the first session so nothing is lost. If you later remove all but one session, the entries are combined back into one daily value.
- If you remove a session while keeping at least two, entries for it stop counting.
- Sessions are not available for time-of-day habits. For separate meals or wake and bedtimes, create separate habits.

| UPDATED: session rules |
| --- |
| Session names must be different within a habit (capital letters and extra spaces are ignored). A single session name is not accepted: use at least two names, or leave the box empty for a habit done once a day. In the edit panel each session has its own line, with its name on the left and its deadline menu on the right. |

## 9. Groups and sub-habits

A group holds related habits, such as a **BCS preparation** group containing English grammar, English literature, Bangla grammar and mathematics.

- Create a group by choosing the **Group** type, then place other habits in it using **Part of group** in their edit panel. A sub-habit takes its group's category.
- In the Log, the group appears as one card showing progress such as 3/4, with its sub-habits listed inside. You can hide or show the list.
- A group counts as done on a day when every sub-habit scheduled for that day is done. The group has its own streak based on that rule.
- Each sub-habit keeps its own type, goal, schedule, deadline and start date, and is counted in reports on its own. The group itself is never counted in totals, so nothing is counted twice.
- Sub-habits that use days-per-week goals are not part of the group's daily completion.
- Groups go one level deep only. A sub-habit cannot contain further sub-habits.
- Archiving a group archives its sub-habits. Deleting a group keeps its sub-habits as ordinary habits.

## 10. Skipping a day on purpose

Sometimes you choose not to do something. Dinner is a good example: on a fasting or diet day you may not eat dinner at all. You do not need a second habit for this.

Tap **More** on the habit and choose **Skip this day**.

- A skipped day is not counted for you or against you. It is left out of completion rates, and it does not break your streak.
- It is shown as "skip" in the Log and Calendar.
- Reports show how many days you skipped on purpose for a single habit.
- Skipping and entering a value are exclusive. Logging a value on a skipped day removes the skip. Skipping a day removes any value you had entered.
- Use the day's note to record why, for example "fasting".

If you also want to track the diet choice itself as an achievement, you can add a separate yes or no habit such as "Fasted today". This is optional.

## 11. Times of day and reminders

A habit can have a **finish by** deadline. Pick a time of day, for example "By the end of the morning (12:00)".

- The five periods are Late night (00:00 to 05:00), Morning (05:00 to 12:00), Afternoon (12:00 to 17:00), Evening (17:00 to 21:00) and Night (21:00 to 23:59). You can rename them and change when each one starts in Settings. The periods follow each other with no gaps or overlaps, each lasts at least 30 minutes, and names must be different. Life OS blocks a change that breaks these rules and tells you why.
- Once the end of a period passes and the habit is not done, it appears in a **Behind schedule** banner at the top of today's Log. For a session habit, each session is checked on its own, and a session is not flagged if the day already counts as done.
- Habits that are skipped, not scheduled today, or measured per week are never flagged.

| NEW: Late night and checked times of day |
| --- |
| Late night runs from 12 am to 5 am on the calendar day. A habit with a late-night deadline is due before 5 am that day, which is separate from the bedtime rule in section 12. In Settings you change when each period starts, and the period before it ends at that moment, so there are never gaps or overlaps. Late night always starts at 00:00 and the last period ends at 23:59. Each period must last at least 30 minutes and names must be different. If a change breaks a rule it is not saved, the old value comes back, and a message explains why. For example, Morning cannot be set to start at 17:00 while Afternoon starts at 12:00. |

**Notifications.** In Settings you can turn on browser notifications. Life OS then shows one notification per late habit when its deadline passes.

**Important limit:** a web app cannot run in the background. Notifications only appear while Life OS is open in a browser tab or window. When the app is closed, you will not be reminded. Some browsers or embedded views may also block notifications altogether. In those cases the banner in the Log still works.

## 12. Times that cross midnight

Bedtime shows the problem clearly. If you aim to be in bed by 11 pm but fall asleep at 1 am, which day does that belong to?

Life OS treats each Log day as the day you are living, which continues until a set hour in the early morning. By default a new day starts at **04:00**.

- A time logged between midnight and the new-day hour counts as **late night of that Log day**, meaning after 24:00.
- Example: on Monday you go to bed at 01:30. You record 01:30 under Monday. It is treated as later than 23:00, so the 23:00 target is missed, and the Log shows how late you were.
- On Tuesday you go to bed at 22:00. You record 22:00 under Tuesday. There is no clash, because the 01:30 belongs to Monday and the 22:00 belongs to Tuesday.
- Averages, earliest and latest times in reports follow the same rule, so a 01:30 bedtime counts as later than 23:30, not earlier.
- You can change the new-day hour in Settings, from midnight to 06:00. If you set it to midnight, times after midnight count as early rather than late.

Only one time can be recorded per habit per day. If you need two bedtimes in one Log day, use two habits.

## 13. Start dates and filling in the past

- A habit starts on the date you choose when you add it. The default is today.
- You can only record a habit from its start date onward. Earlier days are hidden for that habit, so a habit created today does not show up in last week's Log.
- To record the past, choose an earlier start date while adding the habit. For example, set it to five days ago to fill in the last few days.
- The start date can be set once, from 7 days before to 7 days after today. After the habit is added it can't be changed, and the start date is hidden in the edit panel.
- Entries before the start date, or after the 66-day cycle ends, are kept but hidden and not counted.

| CHANGED: the start date is set once and then locked |
| --- |
| Earlier, a start date could be up to a year back or 90 days ahead, and could be edited later. Now it is chosen once when the habit is created, within 7 days before or after today, and then locked. The edit panel does not show it. To use a different start date for now, add the habit again. |

| PLANNED: editing the start date |
| --- |
| Editing a habit's start date after it has been created is planned for a future version. |

## 14. How things are counted

### Done

- Yes or no: ticked.
- Number: the amount reaches the goal, or is above zero if there is no goal.
- Time of day: a time is logged, and it is at or before the target if you set one.
- Sessions: yes or no habits need the chosen number of sessions. Number habits need the total to reach the goal.
- Group: all of its scheduled sub-habits are done.

### Streaks

A streak is the number of consecutive scheduled days you completed a habit. Days the habit was not scheduled and skipped days are passed over without breaking the streak. If today is scheduled but you have not done it yet, the streak counts up to yesterday. Days-per-week habits count consecutive weeks in which the goal was met.

### Completion rate

Completion is the number of scheduled days completed, divided by the scheduled days in the chosen range. Only days inside a habit's 66-day cycle count. Skipped days are left out. Combined and category figures add up their habits' days.

### Time spent

Reports add up time from your own data. Nothing is assumed.

- Number habits measured in minutes or hours count directly.
- Any number habit can have **minutes per unit**, for example 40 minutes per TV episode, 110 per movie or 2 per page.
- A yes or no habit can have **minutes per check-in**, for example 10 minutes for meditation.
- Time-of-day habits and groups are never counted.
- Habits without a time value are listed under "Not counted" so you know what was left out.

| UPDATED: timer minutes |
| --- |
| For a habit with a timer, the minutes from its timer entries are used first, both in Where your time goes and in the hours badges. Habits without a timer are counted as before. |

### XP, levels and badges

- You earn **10 XP** for each completed check-in and **50 XP** for each badge.
- Level 2 begins at 100 XP, and each level needs more than the last (level n begins at 100 × (n − 1)² XP).
- There are 23 badges in five groups: **Streaks** (3, 7, 14, 30, 66 and 100 days, and a four-week run for days-per-week habits), **Consistency** (perfect day, three perfect days, perfect week, 80% completion over 30 days, full cycle), **Volume** (1, 50, 250 and 1000 check-ins), **Time invested** (10, 50 and 100 hours) and **Lifestyle** (balanced day across four categories, seven on-time days in a row for a time habit, ten notes written, and an organised setup of five habits across three categories).
- A "perfect day" means every scheduled habit was done on a day with at least three scheduled.
- Once earned, a badge stays earned. A message appears when you unlock one.

## 15. Navigation, ordering and limits

### Back and Forward

Back and Forward buttons at the top right move through the screens you have visited, like a browser. They are greyed out when there is nowhere to go. Opening a new screen after going back clears the forward history.

### Reordering

In the Habits tab choose **Reorder**. Drag the ⠿ handle to move a category or a habit. Keyboard users can focus a handle and press the up or down arrow. Habits move within their category and sub-habits within their group. To move a habit to another category, change its category in the edit panel. The order is used on every tab.

### Browsing limits

- **Future:** the Calendar and Log can go forward to the end of the month three months from now.
- **Past:** you can go back to one month before your earliest record. A record is a habit's start date or any entry you logged. For example, if your earliest record is in February, you can browse back to January and no further. With no records at all, you can go back one month.
- You cannot log entries for future days.

### Other rules

- Habit names can be up to 60 characters, descriptions 300, daily notes 200, categories 30.
- At least one category must exist.
- Sessions need at least two names and apply to yes or no and number habits only.
- Deleting a habit deletes its entries and notes. Archiving does not.

| NEW: names must be unique |
| --- |
| Habits and groups share one list of names, and archived habits count, so a name still held by an archived habit cannot be reused. Categories have their own list. Session names must differ within a habit, and times of day must have different names. Capital letters and extra spaces are ignored, so "Read" and " read " are the same name. When Life OS blocks a duplicate it shows the reason next to the field or in a message, and a rename that clashes goes back to the old name. |

## 16. Your data

- **Where it lives.** In your browser's own storage on the device you use. It is not sent anywhere.
- **One place only.** Data does not sync between devices or browsers. Clearing site data, or using a private window, removes it.
- **Backup.** In Settings, export everything as JSON, or as CSV for a spreadsheet, and import a JSON backup to restore it or move to another device. Import checks the file format before replacing anything.
- **Undo.** Importing, loading sample data and clearing all data act immediately, and an **Undo** button appears for about ten seconds.
- **Appearance.** The app follows your device's light or dark setting.

| NEW: timer entries and how long they are kept |
| --- |
| Timer entries are stored with the rest of your data and are included in the JSON export. Entries with start times are kept for 30 days by default (7 to 90 in Settings). Older entries become one total per day, so no minutes are lost. |

## 17. Templates and sample data

Templates add ready-made habits. They never replace what you already have, skip any habit whose name you already use, and every habit can be edited afterwards.

- **BCS preparation:** a group with English and Bangla grammar and literature, mathematics, general science, Bangladesh and international affairs, questions solved and revision. English grammar has a morning deadline.
- **Daily routine:** wake up, bedtime, meal times, water and exercise (four days a week).
- **Entertainment log:** TV episodes, movies and gaming, with time per episode and per movie.
- **Student:** classes (weekdays), self-study, homework, revision and practice problems.
- **Job seeker:** applications (weekdays), networking, skill practice, CV work and interview practice.

In Settings, **Load sample data** fills the app with about six months of realistic history across fourteen habits, including a group, sessions, skipped days and deadlines, so you can explore every feature. It replaces your data, can be undone straight away, and is meant for testing.

## 18. Known limitations

- No background reminders. Notifications work only while the app is open.
- No sync, accounts or sharing. Data stays in one browser.
- One time entry per habit per day. A habit can have only one value per day unless it uses sessions.
- Sessions are not available for time-of-day habits.
- Groups are one level deep.
- A habit's schedule applies from its start date. Changing the schedule later changes how past days are counted.
- Past days outside the browsing range cannot be opened, even if they contain entries.
- Entries before a habit's start date, or after its cycle ends, are hidden and not counted.
- Time spent covers only habits with a time value. Anything else is listed as not counted.
- The movie and TV library with titles and episode progress is not included. TV episodes and movies are tracked as daily counts.
- Sleep duration is not calculated automatically from bedtime and wake-up times.

| PLANNED: future versions |
| --- |
| Editing a habit's start date after it has been created (it is locked for now). Sleep duration worked out from bedtime and wake-up times. A titled movie and TV library with episode progress. |

| NEW: limits of the timer |
| --- |
| Only one timer runs at a time. It is not available for time-of-day habits, groups or habits done several times a day. It cannot work in the background: it counts by the clock while the app is closed, so a forgotten pause makes a long entry that you fix in the time log. See section 20. |

## 19. Quick reference

- **Cycle length:** 66 days, extendable by 66 days at a time.
- **Start date range:** 7 days back to 7 days ahead, chosen once when the habit is added.
- **Calendar and Log range:** three months ahead; one month before your earliest record.
- **Week starts on:** Saturday by default (changeable).
- **Weekend:** Friday and Saturday by default (changeable).
- **New day starts at:** 04:00 by default (changeable).
- **Time-of-day periods:** Late night 00:00 to 05:00, Morning 05:00 to 12:00, Afternoon 12:00 to 17:00, Evening 17:00 to 21:00, Night 21:00 to 23:59 (editable, with no gaps or overlaps).
- **XP:** 10 per check-in, 50 per badge.
- **Badges:** 23.
- **Undo window:** about ten seconds.

## 20. Timer and time log (optional)

| NEW: an optional timer for the few who want it |
| --- |
| Most people never need this. The timer is switched on one habit at a time, and until you do, nothing in the Log, Calendar or Reports changes. It is for people who want to know exactly how long they spend on a habit and in which part of the day. |

### Turning it on

- Open a habit's edit panel and tick **Track time with a timer**. It is available for yes or no habits and number habits. It is not available for time-of-day habits, groups, or habits done several times a day.
- A habit with a timer shows a round play button in the Log, on today's date only.

### Start, pause and resume

- Tap the play button to start. A bar at the top of the screen, on every tab, shows the habit name and the running time. Tap **Pause**, in the bar or on the habit's row, to save the time as an entry.
- To resume, tap play again. Every start and pause makes its own entry. Reading in the morning, the afternoon and at night gives three entries for the day, each with its own start time.
- Only one timer runs at a time. Starting a second timer pauses the first and saves its time.
- A timer counts by the clock, so it keeps counting if you close the app. If you forget to pause, the saved entry can be very long. Life OS tells you when an entry is longer than eight hours, and you can correct it in the time log.

### Time log and manual entries

- Tap **More** on the habit to see its **Time log** for that day, with each entry's start time and minutes. You can change an entry's start time or minutes, or delete it.
- If you forgot to press start or pause, add the time by hand with **Add time**. Enter the minutes (1 to 1440) and, if you like, a start time. A start time lets the entry count in the time-of-day report. Manual entries are marked "added".
- You can add or correct entries on past days in the same way. You cannot add time to future days.

### How timer entries are counted

- **Number habits measured in minutes or hours:** the day's value is the total of its entries, so the goal and the done rule work as before. If the day already had a typed number, it becomes the first entry, so nothing is lost. The number box is then a read-only total.
- **Yes or no habits:** a saved entry of at least one minute marks the day done. You can untick it afterwards.
- **Number habits in other units**, such as pages or glasses: the number stays as you typed it. The timer only adds time information.
- Reports and badges use timer minutes first for habits that have a timer.

### When you spend your time

Reports gain a section called **When you spend timed minutes**. It shows a bar and a list of minutes in Late night, Morning, Afternoon, Evening and Night, placed by the time each entry started, with the percentage for each. It follows the scope and range you choose, and it appears only when timer entries exist. An entry that runs past the end of a period is counted in the period where it started.

### How long entries are kept

Detail takes space and is rarely needed forever, so Life OS keeps entries with start times for a limited period and then folds them into daily totals.

- The default is 30 days. In Settings, under Time tracking, you can choose 7, 30, 66 (one cycle) or 90 days.
- Older entries are merged into a single total per day. Your minutes are never lost, but their start times are, so they no longer appear in the time-of-day report.
- Choosing a shorter period merges older entries straight away. This cannot be undone.
- Why 30 days by default: one week shows each weekday only once, which is too little to see a pattern. Thirty days shows each weekday about four times. Keeping 66 days is worth it only if you want patterns across a whole cycle.

### Limits of the timer

- One timer at a time, and only from today's Log.
- Not available for time-of-day habits, groups or habits done several times a day. Turning on several sessions for a habit turns its timer off.
- Placement in a time of day uses the start time only.
- An entry belongs to the day it started, even if it runs past midnight.
- Timer data stays in your browser, like everything else.

## 21. Guide, personalisation and small steps

| NEW: guidance that fits where you are in life |
| --- |
| Life OS can do more than record habits. If you choose, it asks a few short questions and then suggests small, doable steps for your age range and your situation, cheers for small wins in a warm voice, and writes you a short note about your week. It is optional. If you never answer the questionnaire, the app works as before. |

### The questionnaire

It takes about two minutes. Every question can be skipped, and you can change your answers at any time in Guide or in Settings.

- **About you:** a name or nickname (optional) and your age range: under 18, 18 to 22, 23 to 29, 30 to 44, 45 to 59, or 60 and over.
- **Life right now:** in school; in college or university; finished studies and looking for work; working; self-employed; at home with family or caring for others; changing direction or studying while working; between jobs or retired.
- **What you want help with:** up to five of twelve areas, in order of importance: finding or growing a job; studies and exams; soft skills and communication; money and saving; exercise and movement; eating well; sleep and energy; calm, mood and stress; eyes, skin, posture and face care; friends, dating and relationships; family and parenting; play, hobbies and screen balance.
- **A little more (all optional):** relationship, children, and how money feels right now. These only help choose suggestions that fit.
- **How you want to be spoken to:** warm and nurturing, calm and steady, or an upbeat friend.

Life OS does not ask for your gender. Suggestions are chosen from your age range, situation and goals, so nobody gets a different plan only because of who they are.

Everything you answer stays in your browser with the rest of your data. It is included in your JSON export, and you can remove your profile in Settings under Coach and privacy.

### Life phases and age

Your situation and age range decide the wording of the "Where you are" card and which suggestions you see. Some examples:

- Under 18: about an hour of active play most days, an earlier bedtime, short study blocks.
- 18 to 22: sport or play with friends in the evening, a walk, stretching.
- 23 to 44: jogging or brisk exercise about three times a week, aiming towards the common advice of around 150 minutes of moderate activity a week.
- 45 and over: brisk walking, strength and stretching. 60 and over: balance practice and a slightly earlier bedtime.
- Looking for work: a few tailored applications on weekdays, interview practice, reaching out to one person, improving your CV, learning a skill.
- Parent of young children: undivided time with your child and a few minutes just for you.

### The four sections of the Guide tab

- **Today:** a coach note, your one small step for today, a short description of where you are in life, and a thought for the day.
- **My plan:** your suggestions, grouped by area. The first area you chose gets up to four suggestions, the next four areas up to three each. Each one explains why it helps and shows how often, the goal and the small step. Choose **Add to my habits**, **Not for me** (it is hidden, and you can show hidden ones again), or **Add everything below**. A suggestion becomes an ordinary habit that you can edit, with its explanation kept as the habit's details. A habit with the same name is never added twice.
- **This week:** a note on your week and a reflection box. The note says how many days you showed up, how many wins were small steps, which habit is your steadiest, and which one had a harder week, with a gentle suggestion. Your reflection (up to 600 characters) is saved, and the last four are listed.
- **Badges:** as described in section 14.

### Small steps

Big goals are easier to start when the first step is tiny. A number habit can have a **small step** for hard days, set in its edit panel in the same unit as the goal. Suggestions come with one already filled in.

- Doing at least the small step counts as done and keeps your streak.
- The full goal is still tracked separately. Reports show **Small steps counted**, and the Log says "small step counted" on that day.
- In the Log a button such as "Small step: 5 minutes" logs it with one tap.
- The small step must be smaller than the goal. Yes or no habits are already as small as they can be.

| NEW: small steps are celebrated, not penalised |
| --- |
| A day with a small step is a day you showed up. It counts for your streak, it is mentioned warmly in your weekly note, and it is counted on its own so you can see how often you started small. |

### Coach voice and encouragement

- The coach speaks in the voice you chose. It greets you in the morning, midday and evening, notes your progress during the day, cheers when everything scheduled is done, and welcomes you back without any guilt after three or more days away.
- When you log something, a short encouraging message can appear: your first win of the day, a small step, or a finished day.
- The wording avoids shaming. Missing a day is described as a pause, not a failure.
- You can turn coach notes off in Settings, or change the voice, at any time. With coach notes off, none of these messages and no Rough day button appear.

### Rough days

Some days are heavy. With coach notes on, a **Rough day?** button appears at the top of today's Log. It offers two choices, and neither counts against you:

- **Small steps only:** the coach switches to a gentle message, the behind-schedule banner and notifications stay quiet for the day, and you can focus on the small-step buttons.
- **Take a rest day:** every habit scheduled today that you have not done is skipped for today. Skipped days are left out of your totals and your streaks are protected. You can undo it with one tap.

### What the guidance is, and is not

- The suggestions and messages are written into the app. They are rule-based, with no artificial intelligence and no internet service, so nothing about you is sent anywhere.
- They are general well-being suggestions, chosen to be gentle and safe for most people. They are not medical, legal or financial advice.
- **Eating well** offers gentle habits such as water, fruit and vegetables, regular meal times and fewer sugary drinks. It does not set calorie targets or weight goals. A personal diet plan, especially for weight change or a health condition, is best made with a doctor or dietitian.
- Face exercises are offered only as relaxation, because evidence that they change appearance is limited.
- Gaming and hobbies are treated as a healthy part of life. The aim is to keep play a choice by deciding when you play and when you stop.
- If you are in pain, unwell, or feeling very low for more than a couple of weeks, please talk to a doctor or someone you trust.

### Limits

- The library of suggestions is fixed and written in English. New suggestions arrive with new versions of the app.
- The guidance changes when you update your answers. It does not automatically notice that you have moved from one life phase to the next.
- Coach notes and the weekly note react to your logged data, but your plan does not rearrange itself.
- No reminders are sent while the app is closed.

| PLANNED: future versions |
| --- |
| A plan that adjusts by itself after hard weeks or good weeks, a prompt to update your answers when a life phase changes, a larger library of suggestions, and more languages, including Bangla. |
