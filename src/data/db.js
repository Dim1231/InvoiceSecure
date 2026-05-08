import { sha256, rsaSign, simAES256Encrypt, uuidv4 } from '../utils/crypto';
import { getAllInvoices, getAllUsers, saveUser } from '../utils/firebase';

export const DB = {
  users: [
    { user_id:1, nama_lengkap:'Dimas Saputra', email:'dimas@email.com', password_hash:sha256('password123'), nama_perusahaan:'PT InvoiceSecure Indonesia', role:'admin', status:'aktif', created_at:'2026-01-01' },
    { user_id:2, nama_lengkap:'Rina Wulandari', email:'rina@abc.com', password_hash:sha256('pass456'), nama_perusahaan:'CV Karya Abadi', role:'user', status:'aktif', created_at:'2026-02-05' },
  ],
  invoices: [],
  verifikasi_log: [],
  nextUserId: 3,
  nextInvoiceId: 100,
  nextLogId: 1,
};

export async function initDB() {
  try {
    // Load invoices
    const invoices = await getAllInvoices();
    DB.invoices = invoices;
    if (invoices.length > 0) {
      DB.nextInvoiceId = Math.max(...invoices.map(i => i.invoice_id)) + 1;
    }

    // Load users
    const users = await getAllUsers();
    if (users.length > 0) {
      DB.users = users;
      DB.nextUserId = Math.max(...users.map(u => u.user_id)) + 1;
    } else {
      // Save default users ke Firebase kalau belum ada
      for (const u of DB.users) {
        await saveUser(u);
      }
    }
  } catch(e) {
    console.error('Failed to load from Firebase:', e);
  }
}