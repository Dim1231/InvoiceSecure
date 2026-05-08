import { useState } from "react";
import { sha256 } from '../utils/crypto';
import { COLORS, styles } from '../utils/constants';
import { DB } from '../data/db';
import { saveUser } from '../utils/firebase';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('login');
  const [reg, setReg] = useState({ nama:'', email:'', pass:'', perusahaan:'' });
  const [loading, setLoading] = useState(false);
  const mobile = window.innerWidth < 640;

  const handleLogin = () => {
    const user = DB.users.find(u => u.email===email && u.password_hash===sha256(pass));
    if (!user) { setErr('Email atau password salah'); return; }
    if (user.status==='nonaktif') { setErr('Akun tidak aktif'); return; }
    onLogin(user);
  };

  const handleRegister = async () => {
    if (!reg.nama||!reg.email||!reg.pass) { setErr('Lengkapi semua field'); return; }
    if (DB.users.find(u=>u.email===reg.email)) { setErr('Email sudah terdaftar'); return; }
    setLoading(true);
    const newUser = {
      user_id: DB.nextUserId++,
      nama_lengkap: reg.nama,
      email: reg.email,
      password_hash: sha256(reg.pass),
      nama_perusahaan: reg.perusahaan,
      role: 'user',
      status: 'aktif',
      created_at: new Date().toISOString().slice(0,10)
    };
    DB.users.push(newUser);
    await saveUser(newUser);
    setLoading(false);
    onLogin(newUser);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`, padding:16 }}>
      <div style={{ display:'flex', flexDirection: mobile?'column':'row', background:'white', borderRadius:16, overflow:'hidden', width: mobile?'100%':840, maxWidth:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.2)' }}>

        {/* Left panel */}
        <div style={{ width: mobile?'100%':320, background:COLORS.primary, padding: mobile?'24px 20px':40, color:'#fff', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>InvoiceSecure</div>
          <div style={{ fontSize:13, opacity:.8, marginBottom: mobile?12:24 }}>Sistem Manajemen Invoice Elektronik</div>
          {!mobile && ['Enkripsi data invoice dengan AES-256','Verifikasi integritas via SHA-256','Tanda tangan digital RSA-2048','QR Code untuk verifikasi publik','Tanpa instalasi software tambahan'].map((f,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, fontSize:13 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              {f}
            </div>
          ))}
          {mobile && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
              {['AES-256','SHA-256','RSA-2048','QR Code'].map((f,i)=>(
                <div key={i} style={{ fontSize:11, padding:'4px 10px', background:'rgba(255,255,255,.2)', borderRadius:20 }}>{f}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: mobile?12:24, padding:'10px 14px', background:'rgba(255,255,255,.1)', borderRadius:10, fontSize:12 }}>
            Demo: dimas@email.com / password123
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex:1, padding: mobile?'24px 20px':40 }}>
          <div style={{ display:'flex', marginBottom:24, borderBottom:`1px solid ${COLORS.grayMid}` }}>
            {['login','daftar'].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setErr('');}} style={{ flex:1, padding:'10px 0', background:'none', border:'none', borderBottom:tab===t?`2px solid ${COLORS.primary}`:'2px solid transparent', color:tab===t?COLORS.primary:COLORS.gray, fontWeight:tab===t?600:400, cursor:'pointer', fontSize:14, marginBottom:-1 }}>
                {t==='login'?'Masuk':'Daftar Baru'}
              </button>
            ))}
          </div>

          {tab==='login' ? (
            <div>
              <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:600 }}>Masuk ke Akun Anda</h2>
              {['Alamat Email','Kata Sandi'].map((lbl,i)=>(
                <div key={i} style={{ marginBottom:16 }}>
                  <label style={styles.label}>{lbl}</label>
                  <input style={{ ...styles.input, fontSize:16 }} type={i===1?'password':'email'} placeholder={i===0?'contoh@email.com':'••••••••'}
                    value={i===0?email:pass} onChange={e=>i===0?setEmail(e.target.value):setPass(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&handleLogin()} />
                </div>
              ))}
              <div style={{ textAlign:'right', marginBottom:16 }}>
                <span style={{ fontSize:13, color:COLORS.primary, cursor:'pointer' }}>Lupa kata sandi?</span>
              </div>
              {err && <div style={{ color:COLORS.danger, fontSize:13, marginBottom:12, padding:'8px 12px', background:COLORS.dangerLight, borderRadius:8 }}>{err}</div>}
              <button onClick={handleLogin} style={{ ...styles.btn('primary'), width:'100%', justifyContent:'center', padding:'12px 0', fontSize:15 }}>Masuk</button>
              <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px 0' }}>
                <div style={{ flex:1, height:1, background:COLORS.grayMid }}/>
                <span style={{ fontSize:12, color:COLORS.gray }}>atau</span>
                <div style={{ flex:1, height:1, background:COLORS.grayMid }}/>
              </div>
              <button onClick={()=>{setEmail('dimas@email.com');setPass('password123');}} style={{ ...styles.btn('outline'), width:'100%', justifyContent:'center', fontSize:13 }}>Masuk dengan Google</button>
              <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:COLORS.gray }}>
                Belum punya akun? <span onClick={()=>setTab('daftar')} style={{ color:COLORS.primary, fontWeight:600, cursor:'pointer' }}>Daftar di sini</span>
              </div>
              <div style={{ marginTop:12, fontSize:12, color:COLORS.gray, textAlign:'center' }}>
                Halaman verifikasi invoice dapat diakses tanpa login — tidak perlu mendaftar.
              </div>
            </div>
          ) : (
            <div>
              <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:600 }}>Buat Akun Baru</h2>
              {[['Nama Lengkap','nama','text'],['Alamat Email','email','email'],['Kata Sandi','pass','password'],['Nama Perusahaan / Instansi','perusahaan','text']].map(([lbl,key,type])=>(
                <div key={key} style={{ marginBottom:14 }}>
                  <label style={styles.label}>{lbl}</label>
                  <input style={{ ...styles.input, fontSize:16 }} type={type} value={reg[key]} onChange={e=>setReg(r=>({...r,[key]:e.target.value}))} />
                </div>
              ))}
              {err && <div style={{ color:COLORS.danger, fontSize:13, marginBottom:12, padding:'8px 12px', background:COLORS.dangerLight, borderRadius:8 }}>{err}</div>}
              <button onClick={handleRegister} disabled={loading} style={{ ...styles.btn('primary'), width:'100%', justifyContent:'center', padding:'12px 0', fontSize:15 }}>
                {loading ? 'Membuat akun...' : 'Buat Akun'}
              </button>
              <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:COLORS.gray }}>
                Sudah punya akun? <span onClick={()=>setTab('login')} style={{ color:COLORS.primary, fontWeight:600, cursor:'pointer' }}>Masuk di sini</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}