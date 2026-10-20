// Cloud sync for Executive Desk using Firebase Auth (email/password) + Firestore.
// Data path: users/{uid}/{collection}/{recordId}. Firestore keeps a persistent copy on the
// device (IndexedDB), so the app works offline and uploads changes when back online.
import { initializeApp } from "firebase/app";
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail,
} from "firebase/auth";
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocsFromServer,
} from "firebase/firestore";

export function createSync(config) {
  if (!config || !config.apiKey || !config.projectId) return { enabled: false };
  const app = initializeApp(config);
  const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }) });
  let user = null, unsubs = [];
  const pending = {}; let fromCacheAll = {};
  const statusListeners = new Set();
  const emitStatus = () => {
    const s = { online: navigator.onLine, pending: Object.values(pending).some(Boolean), cache: Object.values(fromCacheAll).some(Boolean), user };
    statusListeners.forEach(f => { try { f(s) } catch (e) {} });
  };
  window.addEventListener("online", emitStatus); window.addEventListener("offline", emitStatus);
  const col = name => collection(db, "users", user.uid, name);
  const clean = obj => { const o = {}; for (const [k, v] of Object.entries(obj)) if (!k.startsWith("_") && v !== undefined) o[k] = v; return o; };

  return {
    enabled: true,
    get user() { return user },
    onAuth(cb) { return onAuthStateChanged(auth, u => { user = u ? { uid: u.uid, email: u.email } : null; cb(user) }) },
    signIn: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
    resetPassword: email => sendPasswordResetEmail(auth, email),
    async signOut() { unsubs.forEach(u => u()); unsubs = []; await signOut(auth) },
    onStatus(cb) { statusListeners.add(cb); emitStatus(); return () => statusListeners.delete(cb) },
    // Live-subscribe to every collection; onData(name, records) fires on each change (local or remote).
    subscribe(names, onData, onError) {
      unsubs.forEach(u => u()); unsubs = [];
      names.forEach(name => {
        unsubs.push(onSnapshot(col(name), { includeMetadataChanges: true }, snap => {
          pending[name] = snap.metadata.hasPendingWrites; fromCacheAll[name] = snap.metadata.fromCache;
          onData(name, snap.docs.map(d => ({ ...d.data(), _id: d.id })), snap.metadata); emitStatus();
        }, e => onError && onError(name, e)));
      });
    },
    // Writes resolve when the server confirms; the local copy (and UI) updates immediately,
    // so callers should not await these when offline.
    set: (name, id, obj) => setDoc(doc(db, "users", user.uid, name, id), clean(obj)),
    remove: (name, id) => deleteDoc(doc(db, "users", user.uid, name, id)),
    async putMany(items) { // items: [{name,id,obj}] or [{name,id,del:true}]
      for (let i = 0; i < items.length; i += 400) {
        const b = writeBatch(db);
        items.slice(i, i + 400).forEach(it => { const r = doc(db, "users", user.uid, it.name, it.id); it.del ? b.delete(r) : b.set(r, clean(it.obj)) });
        await b.commit();
      }
    },
    async serverIds(name) { const s = await getDocsFromServer(col(name)); return new Set(s.docs.map(d => d.id)) },
  };
}
