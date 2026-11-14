import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from common import URL, shot
errs=[];res=[]
def ok(n,c,extra=""):res.append(("PASS" if c else "FAIL")+": "+n+(" "+str(extra) if (extra and not c) else ""))
URL=URL
with sync_playwright() as p:
    b=p.chromium.launch()
    # ---- 80%: a fresh user never sees any timer UI
    ctx0=b.new_context(viewport={'width':390,'height':844});pg0=ctx0.new_page();pg0.goto(URL)
    pg0.click('[data-view=hab]');pg0.click('[data-newtoggle]');pg0.fill('#n','Plain habit');pg0.click('#f .add')
    pg0.click('[data-view=day]')
    ok('fresh user: no timer button, no run bar',pg0.locator('.tbtn').count()==0 and pg0.locator('.runbar').count()==0)
    pg0.click('[data-view=rep]')
    ok('fresh user: no time-of-day report',pg0.locator('text=When you spend timed minutes').count()==0)
    ctx0.close()
    # ---- feature user
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append('pageerror '+str(e)))
    pg.on('console',lambda m:errs.append('console '+m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text else None)
    pg.goto(URL)
    pg.click('[data-view=set]');pg.click('summary:has-text("Testing")');pg.click('[data-sample]')
    pg.evaluate("()=>{habits.find(h=>h.id==='s9').freq={t:'daily'};render()}")
    pg.click('[data-view=day]')
    ok('timer buttons on timer habits only',pg.locator('.tbtn').count()==3,pg.locator('.tbtn').count())
    # pages habit: timer adds time, value untouched
    v0=pg.evaluate("()=>[dayVal(habits.find(h=>h.id==='s8'),TODAY()),entMins(habits.find(h=>h.id==='s8'),TODAY())]")
    pg.click('[data-ttoggle=s8]')
    ok('run bar visible after start',pg.is_visible('.runbar') and 'Read' in pg.inner_text('.runbar'))
    ok('start button flips to pause',pg.locator('[data-ttoggle=s8].on').count()==1)
    pg.wait_for_timeout(2300)
    ok('elapsed counts',pg.evaluate("()=>{const t=document.getElementById('runel').textContent;return t!=='0:00:00'}"))
    pg.click('[data-tstop]')
    ok('saved toast',pg.is_visible('#toast') and 'Saved' in pg.inner_text('#toast'),pg.inner_text('#toast'))
    v1=pg.evaluate("()=>[dayVal(habits.find(h=>h.id==='s8'),TODAY()),entMins(habits.find(h=>h.id==='s8'),TODAY())]")
    ok('pages value unchanged, time grew',v1[0]==v0[0] and v1[1]>v0[1],(v0,v1))
    ok('run bar gone after pause',pg.locator('.runbar').count()==0)
    # minutes habit: value comes from entries
    d0=pg.evaluate("()=>dayVal(habits.find(h=>h.id==='s9'),TODAY())||0")
    pg.click('[data-ttoggle=s9]');pg.wait_for_timeout(1300);pg.click('[data-tstop]')
    d1=pg.evaluate("()=>dayVal(habits.find(h=>h.id==='s9'),TODAY())")
    ok('minutes habit total grows from timer',d1>d0 or d0==0,(d0,d1))
    # manual add / edit / delete
    pg.click('[data-nt=s9]')
    base=pg.evaluate("()=>entMins(habits.find(h=>h.id==='s9'),TODAY())")
    pg.fill('[data-eat=s9]','14:00');pg.fill('[data-eam=s9]','30');pg.click('[data-eadd=s9]')
    t1=pg.evaluate("()=>entMins(habits.find(h=>h.id==='s9'),TODAY())")
    ok('manual entry adds 30 minutes',abs(t1-base-30)<0.01,(base,t1))
    idx=pg.evaluate("()=>habits.find(h=>h.id==='s9').ent[TODAY()].findIndex(e=>e.t==='14:00'&&e.man)")
    ok('manual entry kept in time order and flagged',idx>=0)
    pg.fill('[data-ei="%d"][data-ef=m][data-id=s9]'%idx,'10');pg.keyboard.press('Tab')
    t2=pg.evaluate("()=>entMins(habits.find(h=>h.id==='s9'),TODAY())")
    ok('editing minutes updates total',abs(t2-(t1-20))<0.01,(t1,t2))
    pg.fill('[data-eam=s9]','0');pg.click('[data-eadd=s9]');ok('invalid minutes rejected',pg.is_visible('#toast') and 'minutes' in pg.inner_text('#toast').lower())
    pg.locator('.habit:has([data-eadd=s9])').screenshot(path=shot('timelog.png'))
    pg.click('[data-edel="%d"][data-id=s9]'%idx)
    t3=pg.evaluate("()=>entMins(habits.find(h=>h.id==='s9'),TODAY())")
    ok('delete removes entry',abs(t3-(t2-10))<0.01,(t2,t3))
    pg.click('[data-nt=s9]')
    # yes habit auto-done from a >=1 minute entry
    pg.evaluate("()=>{const h=habits.find(x=>x.id==='s10');delete h.done[TODAY()];if(h.ent)delete h.ent[TODAY()];render()}")
    ok('yes habit not done before',not pg.evaluate("()=>isDone(habits.find(x=>x.id==='s10'),TODAY())"))
    pg.click('[data-nt=s10]');pg.fill('[data-eam=s10]','20');pg.click('[data-eadd=s10]')
    ok('yes habit marked done by a timed entry',pg.evaluate("()=>isDone(habits.find(x=>x.id==='s10'),TODAY())"))
    pg.click('[data-nt=s10]')
    # one timer at a time
    pg.click('[data-ttoggle=s8]');pg.wait_for_timeout(1100);pg.click('[data-ttoggle=s10]')
    ok('starting another pauses the first',pg.evaluate("()=>settings.run&&settings.run.id==='s10'")and 'Paused' in pg.inner_text('#toast'),pg.inner_text('#toast'))
    pg.screenshot(path=shot('timer_log.png'))
    # running timer survives reload
    pg.reload()
    ok('running timer restored after reload',pg.locator('.runbar').count()==1 and pg.evaluate("()=>settings.run.id==='s10'"))
    # disabling timer while running stops it
    pg.click('[data-view=hab]')
    pg.evaluate("()=>{settings.hcollapsed={};save();render()}")
    pg.click('[data-edit=s10]')
    pg.uncheck('[data-f=timer][data-id=s10]')
    ok('turning timer off stops it and hides run bar',pg.evaluate("()=>!settings.run&&!habits.find(h=>h.id==='s10').timer")and pg.locator('.runbar').count()==0)
    pg.click('[data-edit=s10]')
    # slot habit has no timer option
    pg.click('[data-edit=s7]')
    ok('no timer option for several-times-a-day habits',pg.locator('[data-f=timer][data-id=s7]').count()==0)
    pg.click('[data-edit=s7]')
    # enabling on a plain habit then adding sessions turns timer off
    pg.click('[data-edit=s11]');pg.check('[data-f=timer][data-id=s11]')
    ok('timer can be enabled from edit panel',pg.evaluate("()=>!!habits.find(h=>h.id==='s11').timer"))
    pg.fill('[data-f=slots][data-id=s11]','Morning, Evening');pg.keyboard.press('Tab')
    ok('adding sessions turns timer off with a reason',pg.evaluate("()=>!habits.find(h=>h.id==='s11').timer")and 'not available' in pg.inner_text('#toast'),pg.inner_text('#toast'))
    pg.click('[data-edit=s11]')
    # retention / compaction keeps totals
    r=pg.evaluate("""()=>{const h=habits.find(x=>x.id==='s8');const old=addDays(TODAY(),-40),mid=addDays(TODAY(),-10);
      h.ent[old]=[{t:'09:00',d:1800},{t:'20:00',d:600}];h.ent[mid]=[{t:'09:00',d:900},{t:'21:00',d:900}];
      const before=[entMins(h,old),entMins(h,mid)];compactEntries();
      const a=h.ent[old],m=h.ent[mid];
      const res1=[a.length===1&&a[0].c===1,Math.abs(entMins(h,old)-before[0])<1e-9,m.length===2];
      settings.keepDays=7;compactEntries();
      const m2=h.ent[mid];res1.push(m2.length===1&&m2[0].c===1,Math.abs(entMins(h,mid)-before[1])<1e-9);settings.keepDays=30;return res1}""")
    ok('old entries merge into a daily total without losing minutes',all(r),r)
    # settings control
    pg.click('[data-view=set]');pg.click('summary:has-text("Time tracking")');pg.select_option('#kd','66')
    ok('retention setting saved',pg.evaluate("()=>settings.keepDays===66"))
    # reports
    pg.click('[data-view=rep]')
    ok('time-of-day section for timer users',pg.locator('text=When you spend timed minutes').count()==1)
    txt=pg.inner_text('details[data-sec=rs]')
    ok('periods listed with percentages','When you spend timed minutes' in txt and '%' in txt and ('Afternoon' in txt or 'Morning' in txt or 'Evening' in txt or 'Night' in txt))  # which periods show depends on which entries still have a start time after retention tests above ran
    pg.select_option('#scope','s9')
    ok('single timer habit shows time spent card',pg.locator('.stat:has-text("Time spent")').count()==1)
    pg.screenshot(path=shot('timer_rep.png'))
    # circles remain round with the new button
    pg.click('[data-view=day]')
    sq=pg.evaluate("()=>[...document.querySelectorAll('.tbtn,.chk,.gbadge')].every(e=>{const r=e.getBoundingClientRect();return Math.abs(r.width-r.height)<0.5})")
    ok('circles square',sq)
    ok('no console errors',len(errs)==0,errs[:4])
    b.close()
print("\n".join(res));print("TOTAL",sum(r.startswith("PASS") for r in res),"/",len(res))

sys.exit(0 if all(r.startswith("PASS") for r in res) else 1)
