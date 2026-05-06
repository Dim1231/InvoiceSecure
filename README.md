# InvoiceSecure

Sistem Manajemen Invoice Elektronik dengan enkripsi AES-256, tanda tangan digital RSA, dan verifikasi SHA-256.

## Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
npm run dev

# 3. Buka browser di http://localhost:5173
```

## Login Demo

- **Admin:** `dimas@email.com` / `password123`
- **User:** `rina@abc.com` / `pass456`

## Struktur File

```
src/
├── App.jsx                    # Root aplikasi & routing
├── main.jsx                   # Entry point React
├── utils/
│   ├── crypto.js              # SHA-256, AES-256, RSA, UUID, QR
│   └── constants.js           # COLORS, styles, format helpers
├── data/
│   └── db.js                  # In-memory database & sample data
├── components/
│   ├── UI.jsx                 # Icon, Modal, Toast, Sidebar
│   └── CryptoDemo.jsx         # Demo kriptografi interaktif
└── pages/
    ├── LoginPage.jsx           # Halaman login & registrasi
    ├── Dashboard.jsx           # Dashboard utama
    ├── BuatInvoice.jsx         # Form buat invoice + InvoiceDetail
    ├── RiwayatInvoice.jsx      # Daftar & filter invoice
    ├── VerifikasiPage.jsx      # Verifikasi keaslian invoice
    ├── AdminPages.jsx          # AdminPengguna & AdminLog
    └── Pengaturan.jsx          # Pengaturan akun & enkripsi
```

## Fitur

- Enkripsi data invoice dengan AES-256-CBC
- Hash SHA-256 sebagai sidik jari digital
- Tanda tangan digital RSA-2048 (demo)
- QR Code untuk verifikasi publik
- Log verifikasi sistem
- Manajemen pengguna (admin)
