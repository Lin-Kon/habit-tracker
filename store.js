/* store.js: saves app data in IndexedDB, which has a far larger limit than localStorage.
   On first run it copies existing localStorage data across, reads it back to check the copy,
   and leaves the old localStorage entry in place. The app never deletes it. */
const DB_NAME = "lifeos", DB_STORE = "kv", DB_ROW = "state";
let storeDB = null, storeChain = Promise.resolve(), storeMode = "idb", storeErr = "", storeReady = false;

function openStoreDB() {
    if (storeDB) return storeDB;
    storeDB = new Promise((res, rej) => {
        if (!self.indexedDB) return rej(new Error("IndexedDB is not available"));
        const r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(DB_STORE);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error || new Error("IndexedDB open failed"));
        r.onblocked = () => rej(new Error("IndexedDB is blocked"));
    });
    storeDB.catch(() => { storeDB = null });
    return storeDB
}

function idbRequest(mode, fn) {
    return openStoreDB().then(db => new Promise((res, rej) => {
        const t = db.transaction(DB_STORE, mode), st = t.objectStore(DB_STORE);
        let out = null;
        const q = fn(st);
        if (q) q.onsuccess = () => { out = q.result };
        t.oncomplete = () => res(out);
        t.onerror = () => rej(t.error);
        t.onabort = () => rej(t.error || new Error("transaction aborted"));
    }))
}
// const idbRead = () => idbRequest("readonly", st => st.get(DB_ROW));
// const idbWrite = obj => idbRequest("readwrite", st => { st.put(obj, DB_ROW); return null });
const kvGet=k=>idbRequest("readonly",st=>st.get(k));
const kvPut=(k,v)=>idbRequest("readwrite",st=>{st.put(v,k);return null});
const idbRead=()=>kvGet(DB_ROW);
const idbWrite=obj=>kvPut(DB_ROW,obj);

function localWrite(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { storeErr = "Browser storage is full" }
}

/* Returns the saved state, or null when there is none. */
async function loadStored() {
    try {
        const cur = await idbRead();
        if (cur) return cur;
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const old = JSON.parse(raw);
        await idbWrite(old);
        const check = await idbRead();
        if (JSON.stringify(check) !== JSON.stringify(old)) throw new Error("copy check failed");
        localStorage.setItem(KEY + "-migrated", "1");
        return old;
    } catch (e) {
        storeMode = "local";
        storeErr = String((e && e.message) || e);
        try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch (x) { return null }
    }
}

/* Every save queues a full write, so the last write always wins. */
function persistState(state) {
    if (!storeReady) return;
    storeChain = storeChain.then(() => {
        if (storeMode === "idb") return idbWrite(state).catch(e => { storeMode = "local"; storeErr = String((e && e.message) || e); localWrite(state) });
        localWrite(state)
    });
}

function askPersistent() {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist() } catch (e) { }
}

const storageLabel = () => storeMode === "idb" ? "IndexedDB (this browser)" : "Older browser storage (fallback)";