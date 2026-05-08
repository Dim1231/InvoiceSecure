import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";

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

export async function saveInvoice(invoice) {
  try {
    await setDoc(doc(db, 'invoices', String(invoice.uuid_invoice)), invoice);
    return true;
  } catch(e) { console.error(e); return false; }
}

export async function getInvoiceByUUID(uuid) {
  try {
    const snap = await getDoc(doc(db, 'invoices', uuid));
    return snap.exists() ? snap.data() : null;
  } catch(e) { return null; }
}

export async function getAllInvoices() {
  try {
    const snap = await getDocs(collection(db, 'invoices'));
    return snap.docs.map(d => d.data());
  } catch(e) { return []; }
}

export async function saveLog(log) {
  try {
    await setDoc(doc(db, 'verifikasi_log', String(log.log_id) + '_' + Date.now()), log);
    return true;
  } catch(e) { return false; }
}

// Realtime listener untuk invoices
export function listenInvoices(callback) {
  const q = query(collection(db, 'invoices'));
  return onSnapshot(q, (snap) => {
    const invoices = snap.docs.map(d => d.data());
    callback(invoices);
  });
}

// Realtime listener untuk log
export function listenLogs(callback) {
  const q = query(collection(db, 'verifikasi_log'));
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map(d => d.data());
    callback(logs);
  });
}