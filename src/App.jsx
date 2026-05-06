import { useState } from "react";
import { styles } from './utils/constants';
import { DB } from './data/db';
import { Toast, Sidebar, Icon } from './components/UI';
import CryptoDemo from './components/CryptoDemo';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BuatInvoice, { InvoiceDetail } from './pages/BuatInvoice';
import RiwayatInvoice from './pages/RiwayatInvoice';
import VerifikasiPage from './pages/VerifikasiPage';
import { AdminPengguna, AdminLog } from './pages/AdminPages';
import Pengaturan from './pages/Pengaturan';
import VerifikasiPublik from './pages/VerifikasiPublik';

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [showCryptoDemo, setShowCryptoDemo] = useState(false);

  const handleLogout = () => { setUser(null); setPage('dashboard'); };


const isVerifyPage = window.location.pathname.startsWith('/verify/');

if (!user && !isVerifyPage) return <LoginPage onLogin={u=>{setUser(u);setPage('dashboard');}} />;

if (!user && isVerifyPage) {
  const uuid = window.location.pathname.split('/verify/')[1];
  return <VerifikasiPublik uuid={uuid} />;
}

  const navStyle = user.role==='admin' ? styles.navbarAdmin : styles.navbar;
  const currentPage = typeof page==='object' ? page.name : page;

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {toast && <Toast {...toast} onDone={()=>setToast(null)} />}

      <nav style={navStyle}>
        <div style={{ display:'flex',alignItems:'center',gap:16 }}>
          <div style={{ fontWeight:700,fontSize:16,letterSpacing:.5 }}>
            {user.role==='admin'?'InvoiceSecure Admin':'InvoiceSecure'}
          </div>
          {user.role==='admin' && ['Dashboard','Pengguna','Invoice','Log Sistem'].map(l=>(
            <button key={l} onClick={()=>setPage(l.toLowerCase().replace(' ','').replace('invoice','riwayat').replace('logsistem','log'))} style={{ background:'none',border:'none',color:'rgba(255,255,255,.7)',cursor:'pointer',fontSize:14,padding:'4px 8px' }}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <button onClick={()=>setShowCryptoDemo(!showCryptoDemo)} style={{ background:'rgba(255,255,255,.15)',border:'none',color:'white',cursor:'pointer',fontSize:12,padding:'4px 10px',borderRadius:6 }}>
            Demo Crypto
          </button>
          <div style={{ fontSize:14,color:'rgba(255,255,255,.8)' }}>{user.nama_lengkap}</div>
          <span style={{ fontSize:11,background:'rgba(255,255,255,.2)',padding:'2px 8px',borderRadius:10,color:'white' }}>{user.role}</span>
          <button onClick={handleLogout} style={{ background:'none',border:'none',color:'rgba(255,255,255,.7)',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:13 }}>
            <Icon name="logout" size={14}/>Keluar
          </button>
        </div>
      </nav>

      <div style={styles.layout}>
        <Sidebar page={currentPage} setPage={setPage} user={user} />
        <main style={styles.main}>
          {showCryptoDemo && <CryptoDemo />}
          {currentPage==='dashboard' && <Dashboard user={user} setPage={setPage} />}
          {currentPage==='buat' && <BuatInvoice user={user} onSave={()=>{setToast({msg:'Invoice berhasil dibuat dan ditandatangani!',type:'success'});}} setPage={setPage} />}
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
