import { useState, useEffect } from "react";
import { styles } from './utils/constants';
import { DB, initDB } from './data/db';
import { listenInvoices, listenLogs } from './utils/firebase';
import { Toast, Sidebar, Icon } from './components/UI';
import CryptoDemo from './components/CryptoDemo';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BuatInvoice, { InvoiceDetail } from './pages/BuatInvoice';
import RiwayatInvoice from './pages/RiwayatInvoice';
import VerifikasiPage from './pages/VerifikasiPage';
import VerifikasiPublik from './pages/VerifikasiPublik';
import { AdminPengguna, AdminLog } from './pages/AdminPages';
import Pengaturan from './pages/Pengaturan';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [showCryptoDemo, setShowCryptoDemo] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [, forceUpdate] = useState(0);

  // Cek apakah URL adalah halaman verifikasi publik
  const isVerifyPage = window.location.pathname.startsWith('/verify/');

  useEffect(() => {
    // Init DB dari Firebase
    initDB().then(() => setDbReady(true));

    // Realtime listener invoices
    const unsubInvoices = listenInvoices((invoices) => {
      DB.invoices = invoices;
      if (invoices.length > 0) {
        DB.nextInvoiceId = Math.max(...invoices.map(i => i.invoice_id)) + 1;
      }
      forceUpdate(n => n + 1);
    });

    // Realtime listener logs
    const unsubLogs = listenLogs((logs) => {
      DB.verifikasi_log = logs;
      forceUpdate(n => n + 1);
    });

    return () => {
      unsubInvoices();
      unsubLogs();
    };
  }, []);

  // Halaman verifikasi publik tanpa login
  if (isVerifyPage) {
    const uuid = window.location.pathname.split('/verify/')[1];
    return <VerifikasiPublik uuid={uuid} />;
  }

  if (!dbReady) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f5' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>🔐</div>
        <div style={{ fontSize:16, fontWeight:500 }}>Memuat InvoiceSecure...</div>
        <div style={{ fontSize:13, color:'#888', marginTop:4 }}>Menghubungkan ke database</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage onLogin={u=>{setUser(u);setPage('dashboard');}} />;

  const navStyle = user.role==='admin' ? styles.navbarAdmin : styles.navbar;
  const currentPage = typeof page==='object' ? page.name : page;

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {toast && <Toast {...toast} onDone={()=>setToast(null)} />}

      <nav style={navStyle}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ fontWeight:700,fontSize:15,letterSpacing:.3 }}>
            {user.role==='admin'?'InvoiceSecure Admin':'InvoiceSecure'}
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <button onClick={()=>setShowCryptoDemo(!showCryptoDemo)} style={{ background:'rgba(255,255,255,.15)',border:'none',color:'white',cursor:'pointer',fontSize:11,padding:'4px 8px',borderRadius:6 }}>
            Demo Crypto
          </button>
          {window.innerWidth>=768 && <div style={{ fontSize:13,color:'rgba(255,255,255,.8)' }}>{user.nama_lengkap}</div>}
          {window.innerWidth>=768 && <span style={{ fontSize:11,background:'rgba(255,255,255,.2)',padding:'2px 8px',borderRadius:10,color:'white' }}>{user.role}</span>}
          <button onClick={()=>{setUser(null);setPage('dashboard');}} style={{ background:'none',border:'none',color:'rgba(255,255,255,.7)',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:13 }}>
            <Icon name="logout" size={14}/>Keluar
          </button>
        </div>
      </nav>

      <div style={styles.layout}>
        <Sidebar page={currentPage} setPage={setPage} user={user} />
        <main style={styles.main}>
          {showCryptoDemo && <CryptoDemo />}
          {currentPage==='dashboard' && <Dashboard user={user} setPage={setPage} />}
          {currentPage==='buat' && <BuatInvoice user={user} onSave={()=>setToast({msg:'Invoice berhasil dibuat!',type:'success'})} setPage={setPage} />}
          {currentPage==='riwayat' && <RiwayatInvoice user={user} setPage={setPage} />}
          {currentPage==='verifikasi' && <VerifikasiPage />}
          {currentPage==='pengguna' && <AdminPengguna />}
          {currentPage==='log' && <AdminLog />}
          {currentPage==='pengaturan' && <Pengaturan user={user} />}
          {currentPage==='detail' && (() => {
            const inv = DB.invoices.find(i=>i.invoice_id===page.id);
            return inv ? <InvoiceDetail invoice={inv} user={user} onBack={()=>setPage('riwayat')} /> : null;
          })()}
        </main>
      </div>
    </div>
  );
}