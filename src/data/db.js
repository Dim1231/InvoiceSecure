import { sha256, rsaSign, simAES256Encrypt, uuidv4 } from '../utils/crypto';

// ── Storage (in-memory) ────────────────────────────────────────────────────
export const DB = {
  users: [
    { user_id: 1, nama_lengkap: 'Dimas Saputra', email: 'dimas@email.com', password_hash: sha256('password123'), nama_perusahaan: 'PT InvoiceSecure Indonesia', role: 'admin', status: 'aktif', created_at: '2026-01-01' },
    { user_id: 2, nama_lengkap: 'Rina Wulandari', email: 'rina@abc.com', password_hash: sha256('pass456'), nama_perusahaan: 'CV Karya Abadi', role: 'user', status: 'aktif', created_at: '2026-02-05' },
  ],
  invoices: [],
  verifikasi_log: [],
  nextUserId: 3,
  nextInvoiceId: 1,
  nextLogId: 1,
};

function generateSampleInvoices() {
  const samples = [
    { user_id:1, nama_penerima:'PT Maju Bersama', items:[{nama_item:'Jasa Konsultasi IT',qty:2,harga_satuan:1500000},{nama_item:'Lisensi Software',qty:1,harga_satuan:2000000}], diskon_persen:0, ppn:8 },
    { user_id:1, nama_penerima:'CV Karya Abadi', items:[{nama_item:'Setup Server & Konfigurasi',qty:1,harga_satuan:2100000}], diskon_persen:5, ppn:8 },
    { user_id:2, nama_penerima:'Toko Barokah', items:[{nama_item:'Maintenance Tahunan',qty:1,harga_satuan:800000}], diskon_persen:0, ppn:0 },
    { user_id:1, nama_penerima:'PT Global Niaga', items:[{nama_item:'Pengembangan Web',qty:3,harga_satuan:2500000},{nama_item:'Domain & Hosting',qty:1,harga_satuan:900000}], diskon_persen:10, ppn:8 },
  ];
  samples.forEach((s,i) => {
    const subtotal = s.items.reduce((sum,it)=>sum+it.qty*it.harga_satuan,0);
    const diskon = subtotal * s.diskon_persen/100;
    const ppnVal = (subtotal-diskon)*s.ppn/100;
    const total = subtotal - diskon + ppnVal;
    const dataStr = JSON.stringify({...s, subtotal, diskon, ppnVal, total});
    const hash = sha256(dataStr);
    const sig = rsaSign(hash);
    const uuid = uuidv4();
    DB.invoices.push({
      invoice_id: DB.nextInvoiceId++,
      user_id: s.user_id,
      uuid_invoice: uuid,
      nomor_invoice: `INV-2026-0${20+i+1}`,
      tanggal_invoice: `2026-03-${10+i}`,
      nama_penerima: s.nama_penerima,
      items: s.items,
      subtotal, diskon, diskon_persen: s.diskon_persen, ppn: ppnVal, ppn_persen: s.ppn,
      total_bayar: total,
      hash_sha256: hash,
      rsa_signature: sig,
      data_terenkripsi: simAES256Encrypt(dataStr, 'aes-master-key'),
      qr_code_url: `https://invoicesecure.id/verify/${uuid}`,
      status_validasi: 'valid',
      tanggal_dibuat: `2026-03-${10+i} 09:00:00`,
    });
  });
}
generateSampleInvoices();
