import { useState } from "react";
import { sha256 } from '../utils/crypto';
import { COLORS, styles } from '../utils/constants';
import { DB } from '../data/db';

// ── Auth ────────────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('login');
  const [reg, setReg] = useState({ nama:'', email:'', pass:'', perusahaan:'' });

  const handleLogin = () => {
    const user = DB.users.find(u => u.email===email && u.password_hash===sha256(pass));
    if (!user) { setErr('Email atau password salah'); return; }
    if (user.status==='nonaktif') { setErr('Akun tidak aktif'); return; }
    onLogin(user);
  };

  const handleRegister = () => {
    if (!reg.nama||!reg.email||!reg.pass) { setErr('Lengkapi semua field'); return; }
    if (DB.users.find(u=>u.email===reg.email)) { setErr('Email sudah terdaftar'); return; }
    const newUser = { user_id:DB.nextUserId++, nama_lengkap:reg.nama, email:reg.email, password_hash:sha256(reg.pass), nama_perusahaan:reg.perusahaan, role:'user', status:'aktif', created_at:new Date().toISOString().slice(0,10) };
    DB.users.push(newUser);
    onLogin(newUser);
  };

  return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)` }}>
      <div style={{ display:'flex',background:'var(--color-background-primary)',borderRadius:16,overflow:'hidden',width:840,boxShadow:'0 24px 64px rgba(0,0,0,.2)' }}>
        {/* Left panel */}
        <div style={{ width:320,background:COLORS.primary,padding:40,color:'#fff',display:'flex',flexDirection:'column',justifyContent:'center' }}>
          <div style={{ fontSize:24,fontWeight:700,marginBottom:8 }}>InvoiceSecure</div>
          <div style={{ fontSize:13,opacity:.8,marginBottom:32 }}>Sistem Manajemen Invoice Elektronik</div>
          {['Enkripsi data invoice dengan AES-256','Verifikasi integritas via SHA-256','Tanda tangan digital RSA-2048','QR Code untuk verifikasi publik','Tanpa instalasi software tambahan'].map((f,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10,fontSize:13 }}>
              <div style={{ width:18,height:18,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              {f}
            </div>
          ))}
          <div style={{ marginTop:32,padding:'12px 16px',background:'rgba(255,255,255,.1)',borderRadius:10,fontSize:12,opacity:.9 }}>
            Demo: dimas@email.com / password123
          </div>
        </div>
        {/* Right panel */}
        <div style={{ flex:1,padding:40 }}>
          <div style={{ display:'flex',gap:0,marginBottom:24,borderBottom:'1px solid var(--color-border-tertiary)' }}>
            {['login','daftar'].map(t => (
              <button key={t} onClick={()=>{setTab(t);setErr('');}} style={{ flex:1,padding:'10px 0',background:'none',border:'none',borderBottom:tab===t?`2px solid ${COLORS.primary}`:'2px solid transparent',color:tab===t?COLORS.primary:'var(--color-text-secondary)',fontWeight:tab===t?500:400,cursor:'pointer',fontSize:14,textTransform:'capitalize',transition:'all .15s',marginBottom:-1 }}>
                {t==='login'?'Masuk':'Daftar Baru'}
              </button>
            ))}
          </div>

          {tab==='login' ? (
            <div>
              <h2 style={{ margin:'0 0 24px',fontSize:20,fontWeight:500 }}>Masuk ke Akun Anda</h2>
              {['Alamat Email','Kata Sandi'].map((lbl,i) => (
                <div key={i} style={{ marginBottom:16 }}>
                  <label style={styles.label}>{lbl}</label>
                  <input style={styles.input} type={i===1?'password':'email'} placeholder={i===0?'contoh@email.com':'••••••••'}
                    value={i===0?email:pass} onChange={e=>i===0?setEmail(e.target.value):setPass(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&handleLogin()} />
                </div>
              ))}
              {err && <div style={{ color:COLORS.danger,fontSize:13,marginBottom:12 }}>{err}</div>}
              <button onClick={handleLogin} style={{ ...styles.btn('primary'),width:'100%',justifyContent:'center',padding:'10px 0',fontSize:15 }}>Masuk</button>
              <button onClick={()=>{setEmail('dimas@email.com');setPass('password123');}} style={{ ...styles.btn('outline'),width:'100%',justifyContent:'center',marginTop:10,fontSize:13 }}>Isi data demo</button>
            </div>
          ) : (
            <div>
              <h2 style={{ margin:'0 0 24px',fontSize:20,fontWeight:500 }}>Buat Akun Baru</h2>
              {[['Nama Lengkap','nama','text'],['Alamat Email','email','email'],['Kata Sandi','pass','password'],['Nama Perusahaan','perusahaan','text']].map(([lbl,key,type]) => (
                <div key={key} style={{ marginBottom:14 }}>
                  <label style={styles.label}>{lbl}</label>
                  <input style={styles.input} type={type} value={reg[key]} onChange={e=>setReg(r=>({...r,[key]:e.target.value}))} />
                </div>
              ))}
              {err && <div style={{ color:COLORS.danger,fontSize:13,marginBottom:12 }}>{err}</div>}
              <button onClick={handleRegister} style={{ ...styles.btn('primary'),width:'100%',justifyContent:'center',padding:'10px 0',fontSize:15 }}>Buat Akun</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
