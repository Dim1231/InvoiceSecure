import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, onSnapshot, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0N2mtDJGoRhGtUjMwZOmtCHfkgABy5eA",
  authDomain: "invoice-215be.firebaseapp.com",
  projectId: "invoice-215be",
  storageBucket: "invoice-215be.firebasestorage.app",
  messagingSenderId: "80295338521",
  appId: "1:80295338521:web:6b6144700ae23e1531c088"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Error reporting ──────────────────────────────────────────────────────────
// Dipanggil setiap kali operasi Firebase gagal (read/write/listen), supaya
// error tidak "hilang" diam-diam. App.jsx mendaftarkan listener untuk ini
// dan menampilkannya sebagai banner peringatan di UI.
let onErrorHandler = null;
export function setFirebaseErrorHandler(fn) { onErrorHandler = fn; }
function reportError(context, e) {
  console.error(`[Firebase:${context}]`, e?.code || '', e?.message || e);
  if (onErrorHandler) onErrorHandler({ context, code: e?.code, message: e?.message || String(e) });
}

// ── Invoice ────────────────────────────────────────────────────────────────
export async function saveInvoice(invoice) {
  try {
    await setDoc(doc(db, 'invoices', String(invoice.uuid_invoice)), invoice);
    return true;
  } catch(e) { reportError('saveInvoice', e); return false; }
}

export async function getInvoiceByUUID(uuid) {
  try {
    const snap = await getDoc(doc(db, 'invoices', uuid));
    return snap.exists() ? snap.data() : null;
  } catch(e) { reportError('getInvoiceByUUID', e); return null; }
}

export async function getAllInvoices() {
  try {
    const snap = await getDocs(collection(db, 'invoices'));
    return snap.docs.map(d => d.data());
  } catch(e) { reportError('getAllInvoices', e); return []; }
}

export function listenInvoices(callback) {
  return onSnapshot(query(collection(db, 'invoices')), (snap) => {
    callback(snap.docs.map(d => d.data()));
  }, (e) => reportError('listenInvoices', e));
}

// ── Users ──────────────────────────────────────────────────────────────────
export async function saveUser(user) {
  try {
    await setDoc(doc(db, 'users', String(user.user_id)), user);
    return true;
  } catch(e) { reportError('saveUser', e); return false; }
}

export async function getAllUsers() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data());
  } catch(e) { reportError('getAllUsers', e); return []; }
}

export function listenUsers(callback) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    callback(snap.docs.map(d => d.data()));
  }, (e) => reportError('listenUsers', e));
}

// ── Log ────────────────────────────────────────────────────────────────────
export async function saveLog(log) {
  try {
    await setDoc(doc(db, 'verifikasi_log', String(log.log_id) + '_' + Date.now()), log);
    return true;
  } catch(e) { reportError('saveLog', e); return false; }
}

export function listenLogs(callback) {
  return onSnapshot(collection(db, 'verifikasi_log'), (snap) => {
    callback(snap.docs.map(d => d.data()));
  }, (e) => reportError('listenLogs', e));
}