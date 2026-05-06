import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc } from "firebase/firestore";

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

// ── Invoice functions ──────────────────────────────────────────────────────

export async function saveInvoice(invoice) {
  try {
    await setDoc(doc(db, 'invoices', String(invoice.uuid_invoice)), invoice);
    return true;
  } catch(e) {
    console.error('Error saving invoice:', e);
    return false;
  }
}

export async function getInvoiceByUUID(uuid) {
  try {
    const snap = await getDoc(doc(db, 'invoices', uuid));
    if (snap.exists()) return snap.data();
    return null;
  } catch(e) {
    console.error('Error getting invoice:', e);
    return null;
  }
}

export async function getAllInvoices() {
  try {
    const snap = await getDocs(collection(db, 'invoices'));
    return snap.docs.map(d => d.data());
  } catch(e) {
    console.error('Error getting invoices:', e);
    return [];
  }
}

export async function saveVerifikasiLog(log) {
  try {
    await setDoc(doc(db, 'verifikasi_log', String(log.log_id)), log);
    return true;
  } catch(e) {
    console.error('Error saving log:', e);
    return false;
  }
}