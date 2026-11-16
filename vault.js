/* vault.js: passphrase lock for private text (weekly reflections and daily habit notes).
   A random data key (AES-GCM 256) encrypts the text. That key is stored twice, each time wrapped:
   1) with a key derived from the passphrase (PBKDF2, SHA-256, 310,000 rounds), and
   2) with a recovery key (16 random bytes) that the user prints and keeps.
   Either one unlocks the text. Nothing is stored in plain form. Needs https or localhost.
   Format 2. Vaults from the first version are upgraded the first time they are unlocked. */
const VAULT_ITER = 310000, VAULT_TEST = "lifeos-vault-check";
let vaultKey = null, reflPlain = {}, notePlain = {}, vaultRecovery = "";
const vaultOn = () => !!(settings.vault && settings.vault.check);
const vaultLocked = () => vaultOn() && !vaultKey;
const isEnc = v => !!v && typeof v === "object";
const nkey = (h, d) => h.id + "|" + d;
const toB64 = buf => { let s = ""; new Uint8Array(buf).forEach(b => { s += String.fromCharCode(b) }); return btoa(s) };
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const toHex = buf => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
const fromHex = s => Uint8Array.from(s.match(/../g).map(x => parseInt(x, 16)));
const fmtRec = h => h.match(/.{1,4}/g).join("-");

/* ---- low-level encryption */
async function vaultDeriveKey(pass, salt, iter) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
}
async function encBytes(key, bytes) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
    return { iv: toB64(iv), ct: toB64(ct) }
}
async function decBytes(key, o) {
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(o.iv) }, key, fromB64(o.ct)))
}
const vaultEnc = (key, text) => encBytes(key, new TextEncoder().encode(text));
async function vaultDec(key, o) { return new TextDecoder().decode(await decBytes(key, o)) }

/* ---- data key and its two wraps */
const newDataKey = () => crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
async function wrapDataKey(kek, dk) { return encBytes(kek, new Uint8Array(await crypto.subtle.exportKey("raw", dk))) }
async function unwrapDataKey(kek, w) { return crypto.subtle.importKey("raw", await decBytes(kek, w), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]) }
async function passWrap(pass, dk) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), kek = await vaultDeriveKey(pass, salt, VAULT_ITER);
    return { salt: toB64(salt), wrap: await wrapDataKey(kek, dk) }
}
async function recoveryWrap(dk) {
    const rb = crypto.getRandomValues(new Uint8Array(16));
    const rk = await crypto.subtle.importKey("raw", rb, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    return { code: toHex(rb), wrap: await wrapDataKey(rk, dk) }
}

/* Encrypt every private text under the data key; keep plain copies in memory while unlocked. */
async function sealAll(dk, pr, pn) {
    const r = {}; for (const k of Object.keys(pr)) r[k] = await vaultEnc(dk, pr[k]);
    settings.reflections = r;
    const np = {};
    for (const h of habits) for (const d of Object.keys(h.notes || {})) {
        const k = nkey(h, d), txt = isEnc(h.notes[d]) ? pn[k] : h.notes[d];
        if (txt) { h.notes[d] = await vaultEnc(dk, txt); np[k] = txt } else delete h.notes[d]
    }
    vaultKey = dk; reflPlain = pr; notePlain = np
}

/* Checks the data key against the test value, then loads plain copies. */
async function openWith(dk) {
    let ok = false; try { ok = await vaultDec(dk, settings.vault.check) === VAULT_TEST } catch (e) { }
    if (!ok) return false;
    vaultKey = dk; reflPlain = {}; notePlain = {};
    for (const k of Object.keys(settings.reflections || {})) { try { reflPlain[k] = await vaultDec(dk, settings.reflections[k]) } catch (e) { } }
    for (const h of habits) for (const d of Object.keys(h.notes || {})) { if (isEnc(h.notes[d])) { try { notePlain[nkey(h, d)] = await vaultDec(dk, h.notes[d]) } catch (e) { } } }
    return true
}

/* ---- setup, unlock, upgrade */
async function vaultSetup(pass) {
    const dk = await newDataKey(), pw = await passWrap(pass, dk), rc = await recoveryWrap(dk);
    const pr = {}; Object.keys(settings.reflections || {}).forEach(k => { pr[k] = settings.reflections[k] });
    const pn = {}; habits.forEach(h => Object.keys(h.notes || {}).forEach(d => { if (!isEnc(h.notes[d])) pn[nkey(h, d)] = h.notes[d] }));
    await sealAll(dk, pr, pn);
    settings.vault = { v: 2, iter: VAULT_ITER, salt: pw.salt, check: await vaultEnc(dk, VAULT_TEST), wrapP: pw.wrap, wrapR: rc.wrap };
    vaultRecovery = rc.code; save(); return true
}

async function vaultUnlock(pass) {
    if (!vaultOn()) return false;
    const v = settings.vault;
    if (v.v !== 2) return upgradeV1(pass);
    const kek = await vaultDeriveKey(pass, fromB64(v.salt), v.iter || VAULT_ITER);
    let dk; try { dk = await unwrapDataKey(kek, v.wrapP) } catch (e) { return false }
    return openWith(dk)
}

async function vaultUnlockRecovery(code) {
    if (!vaultOn() || settings.vault.v !== 2) return false;
    const hex = String(code).toLowerCase().replace(/[^0-9a-f]/g, "");
    if (hex.length !== 32) return false;
    const rk = await crypto.subtle.importKey("raw", fromHex(hex), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    let dk; try { dk = await unwrapDataKey(rk, settings.vault.wrapR) } catch (e) { return false }
    return openWith(dk)
}

/* First version of the lock: the passphrase key encrypted the data directly. Read with that key, then move to format 2. */
async function upgradeV1(pass) {
    const v = settings.vault, kek = await vaultDeriveKey(pass, fromB64(v.salt), v.iter || VAULT_ITER);
    let ok = false; try { ok = await vaultDec(kek, v.check) === VAULT_TEST } catch (e) { }
    if (!ok) return false;
    const pr = {}, pn = {};
    for (const k of Object.keys(settings.reflections || {})) { try { pr[k] = await vaultDec(kek, settings.reflections[k]) } catch (e) { } }
    for (const h of habits) for (const d of Object.keys(h.notes || {})) { if (isEnc(h.notes[d])) { try { pn[nkey(h, d)] = await vaultDec(kek, h.notes[d]) } catch (e) { } } }
    const dk = await newDataKey(), pw = await passWrap(pass, dk), rc = await recoveryWrap(dk);
    await sealAll(dk, pr, pn);
    settings.vault = { v: 2, iter: VAULT_ITER, salt: pw.salt, check: await vaultEnc(dk, VAULT_TEST), wrapP: pw.wrap, wrapR: rc.wrap };
    vaultRecovery = rc.code; save(); return true
}

/* ---- changing keys, locking, turning off */
async function vaultRekey(pass) {
    if (!vaultKey) return false;
    const pw = await passWrap(pass, vaultKey);
    settings.vault.salt = pw.salt; settings.vault.iter = VAULT_ITER; settings.vault.wrapP = pw.wrap; save(); return true
}

async function vaultNewRecovery() {
    if (!vaultKey) return false;
    const rc = await recoveryWrap(vaultKey); settings.vault.wrapR = rc.wrap; vaultRecovery = rc.code; save(); return true
}

function vaultLock() { vaultKey = null; reflPlain = {}; notePlain = {} }

/* Turns the lock off, storing everything as plain text again. Only possible while unlocked. */
function vaultOff() {
    if (!vaultKey) return false;
    const r = {}; Object.keys(reflPlain).forEach(k => { r[k] = reflPlain[k] }); settings.reflections = r;
    for (const h of habits) for (const d of Object.keys(h.notes || {})) { if (isEnc(h.notes[d])) { const t = notePlain[nkey(h, d)]; if (t) h.notes[d] = t; else delete h.notes[d] } }
    delete settings.vault; vaultRecovery = ""; vaultLock(); save(); return true
}

/* ---- reading and writing private text */
const reflGet = k => vaultOn() ? (vaultKey ? (reflPlain[k] || "") : "") : ((settings.reflections && settings.reflections[k]) || "");
async function reflSet(k, v) {
    if (!vaultOn()) { if (v) settings.reflections[k] = v; else delete settings.reflections[k]; save(); return true }
    if (!vaultKey) return false;
    if (v) { reflPlain[k] = v; settings.reflections[k] = await vaultEnc(vaultKey, v) }
    else { delete reflPlain[k]; delete settings.reflections[k] }
    save(); return true
}

/* Daily note: plain text, or '' when locked. Use noteLocked to show the lock. */
function noteGet(h, d) { const v = h.notes && h.notes[d]; if (!v) return ""; return isEnc(v) ? (notePlain[nkey(h, d)] || "") : v }
const noteLocked = (h, d) => isEnc(h.notes && h.notes[d]) && !vaultKey;
async function noteSet(h, d, v) {
    h.notes = h.notes || {};
    if (!vaultOn()) { if (v) h.notes[d] = v; else delete h.notes[d]; return true }
    if (!vaultKey) return false;
    if (v) { notePlain[nkey(h, d)] = v; h.notes[d] = await vaultEnc(vaultKey, v) }
    else { delete notePlain[nkey(h, d)]; delete h.notes[d] }
    return true
}

/* ---- Settings panel */
function lockPanelHtml() {
    const rec = vaultRecovery ? '<div class="cycbox"><b>Your recovery key</b><p class="note">Print it or write it down and keep it somewhere safe. It is shown only now. Anyone with this key can read your private text, and the app cannot recover it for you.</p><p class="rkey">' + esc(fmtRec(vaultRecovery)) + '</p><div class="row wrap"><button class="btn" data-vprint>Print</button><button class="btn" data-vrecack>I have written it down</button></div></div>' : "";
    if (!vaultOn()) return '<p class="note">Protect your weekly reflections and daily habit notes with a passphrase. Everything is encrypted on this device. The passphrase is never stored. You will also get a recovery key to keep on paper, so you can still read your notes if you forget the passphrase.</p><input id="vp" type="password" autocomplete="new-password" placeholder="Choose a passphrase (at least 8 characters)" aria-label="New passphrase"><input id="vp2" type="password" autocomplete="new-password" placeholder="Repeat passphrase" aria-label="Repeat passphrase" style="margin-top:8px"><div class="row wrap" style="margin-top:8px"><button class="btn" data-von>Turn on lock</button></div>';
    if (!vaultKey) return rec + '<p class="note">Locked. Enter your passphrase, or your recovery key, to read and write private text.</p><input id="vp" type="password" autocomplete="current-password" placeholder="Passphrase" aria-label="Passphrase"><div class="row wrap" style="margin-top:8px"><button class="btn" data-vunlock>Unlock</button></div><input id="vr" autocomplete="off" placeholder="Recovery key (32 characters)" aria-label="Recovery key" style="margin-top:8px"><div class="row wrap" style="margin-top:8px"><button class="btn" data-vunlockrec>Unlock with recovery key</button></div>';
    return rec + '<p class="note">Unlocked for this session. The app locks after no activity for the time below, and whenever you return after being away that long.</p><label class="note" for="lidle">Lock after no activity</label><select id="lidle">'+[[1,"1 minute"],[5,"5 minutes"],[15,"15 minutes"],[30,"30 minutes"]].map(([v,l])=>'<option value="'+v+'"'+(idleMins()===v?" selected":"")+">"+l+"</option>").join("")+'</select><div class="row wrap" style="margin-top:8px"><button class="btn" data-vlock>Lock now</button><button class="btn" data-voff>Turn off lock</button></div><p class="note">Change your passphrase. Your recovery key still works.</p><input id="vn" type="password" autocomplete="new-password" placeholder="New passphrase (at least 8 characters)" aria-label="New passphrase"><input id="vn2" type="password" autocomplete="new-password" placeholder="Repeat new passphrase" aria-label="Repeat new passphrase" style="margin-top:8px"><div class="row wrap" style="margin-top:8px"><button class="btn" data-vchange>Change passphrase</button><button class="btn" data-vnewrec>New recovery key</button></div>';
}

/* ---- idle auto-lock: locks after the chosen minutes with no touch, key press, input or scroll,
   and when the app returns after being away that long. */
let idleT = null, hiddenAt = 0;
const idleMins = () => { const m = Number(settings.lockMins); return [1, 5, 15, 30].includes(m) ? m : 5 };
function lockNow() {
    if (!vaultKey) return;
    vaultLock(); clearTimeout(idleT); idleT = null;
    if (typeof render === "function") render();
    if (typeof toast === "function") toast("Locked. Private notes are hidden until you unlock.")
}
function armIdle() {
    clearTimeout(idleT); idleT = null;
    if (vaultKey) idleT = setTimeout(lockNow, idleMins() * 60e3)
}
["pointerdown", "keydown", "scroll", "input"].forEach(ev => document.addEventListener(ev, () => { if (vaultKey) armIdle() }, { capture: true, passive: true }));
document.addEventListener("visibilitychange", () => {
    if (document.hidden) { hiddenAt = Date.now(); return }
    if (vaultKey && hiddenAt && Date.now() - hiddenAt > idleMins() * 60e3) lockNow();
    else if (vaultKey) armIdle();
    hiddenAt = 0
});