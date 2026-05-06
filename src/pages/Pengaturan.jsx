import { useState } from "react";
import { COLORS, styles } from '../utils/constants';
import { Toast, Icon } from '../components/UI';

export default function Pengaturan({ user }) {
  const mobile = window.innerWidth < 768;
  const [activeTab, setActiveTab] = useState('profil');
  const [profil, setProfil] = useState({ nama: user.nama_lengkap, email: user.email, telepon: '', perusahaan: user.nama_perusahaan||'' });
  const [pass, setPass] = useState({ lama:'', baru:'', konfirmasi:'' });
  const [toast, setToast] = useState(null);

  const tabs = ['profil','keamanan','enkripsi','notifikasi'];

  return (
    <div>
      {toast && <Toast {...toast} onDone={()=>setToast(null)} />}
      <h1 style={{ margin:'0 0 24px',fontSize:22,fontWeight:500 }}>Pengaturan Akun</h1>

      <div style={{ display:'flex',borderBottom:'1px solid var(--color-border-tertiary)',marginBottom:24,overflowX:'auto' }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:'10px 16px',background:'none',border:'none',borderBottom:activeTab===t?`2px solid ${COLORS.primary}`:'2px solid transparent',color:activeTab===t?COLORS.primary:'var(--color-text-secondary)',fontWeight:activeTab===t?500:400,cursor:'pointer',fontSize:13,textTransform:'capitalize',transition:'all .15s',marginBottom:-1,whiteSpace:'nowrap' }}>
            {t==='enkripsi'?'Enkripsi & Kunci':t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab==='profil' && (
        <div style={styles.card}>
          <h3 style={{ margin:'0 0 16px',fontSize:14,fontWeight:500 }}>Informasi Profil</h3>
          <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap:12 }}>
            {[['Nama Lengkap','nama','text'],['Alamat Email','email','email'],['Nomor Telepon','telepon','tel'],['Nama Perusahaan','perusahaan','text']].map(([lbl,key,type])=>(
              <div key={key}>
                <label style={styles.label}>{lbl}</label>
                <input style={styles.input} type={type} value={profil[key]} onChange={e=>setProfil(p=>({...p,[key]:e.target.value}))} />
              </div>
            ))}
          </div>
          <div style={{ marginTop:16,display:'flex',gap:8 }}>
            <button onClick={()=>setToast({msg:'Profil berhasil diperbarui',type:'success'})} style={styles.btn('primary')}>Simpan Perubahan</button>
            <button style={styles.btn('outline')}>Batal</button>
          </div>
        </div>
      )}

      {activeTab==='keamanan' && (
        <div style={styles.card}>
          <h3 style={{ margin:'0 0 16px',fontSize:14,fontWeight:500 }}>Ganti Kata Sandi</h3>
          {[['Password Lama','lama'],['Password Baru','baru'],['Konfirmasi Password Baru','konfirmasi']].map(([lbl,key])=>(
            <div key={key} style={{ marginBottom:14 }}>
              <label style={styles.label}>{lbl}</label>
              <input style={styles.input} type="password" value={pass[key]} onChange={e=>setPass(p=>({...p,[key]:e.target.value}))} />
            </div>
          ))}
          <div style={{ padding:12,background:COLORS.warningLight,borderRadius:8,fontSize:12,color:COLORS.warning,marginBottom:16 }}>
            <Icon name="alert" size={13}/> Password minimal 8 karakter dengan kombinasi huruf dan angka
          </div>
          <button onClick={()=>{if(pass.baru!==pass.konfirmasi){setToast({msg:'Password tidak cocok',type:'error'});return;}setToast({msg:'Password berhasil diperbarui',type:'success'});setPass({lama:'',baru:'',konfirmasi:''}); }} style={styles.btn('primary')}>Perbarui Password</button>
        </div>
      )}

      {activeTab==='enkripsi' && (
        <div>
          <div style={styles.card}>
            <h3 style={{ margin:'0 0 16px',fontSize:14,fontWeight:500 }}>Status Enkripsi AES-256</h3>
            <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap:12, marginBottom:16 }}>
              {[['Algoritma','AES-256-CBC'],['Mode','Cipher Block Chaining'],['Kunci','256-bit (Server-side)'],['IV','128-bit Acak per Invoice'],['Status','Aktif'],['Dibuat','2026-01-01']].map(([k,v])=>(
                <div key={k} style={{ padding:'10px 14px',background:'var(--color-background-secondary)',borderRadius:8 }}>
                  <div style={{ fontSize:11,color:'var(--color-text-secondary)' }}>{k}</div>
                  <div style={{ fontWeight:500,fontSize:13 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:12,background:COLORS.dangerLight,borderRadius:8,fontSize:12,color:COLORS.danger,marginBottom:12 }}>
              <Icon name="alert" size={13}/> Perhatian: Regenerasi kunci AES akan membuat invoice lama tidak dapat didekripsi
            </div>
            <button style={styles.btn('danger')}>Regenerasi Kunci AES</button>
          </div>

          <div style={styles.card}>
            <h3 style={{ margin:'0 0 16px',fontSize:14,fontWeight:500 }}>Parameter RSA-2048</h3>
            <div style={{ display:'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3,1fr)', gap:12, marginBottom:16 }}>
              {[['p (prima)','61 (demo)'],['q (prima)','53 (demo)'],['n (modulus)','3233'],['e (publik)','17'],['d (privat)','2753 (rahasia)'],['Ukuran Kunci','2048-bit (produksi)']].map(([k,v])=>(
                <div key={k} style={{ padding:'10px 14px',background:'var(--color-background-secondary)',borderRadius:8 }}>
                  <div style={{ fontSize:11,color:'var(--color-text-secondary)' }}>{k}</div>
                  <div style={{ fontWeight:500,fontFamily:'monospace',fontSize:13 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:12,background:COLORS.primaryLight,borderRadius:8,fontSize:12,color:COLORS.primary }}>
              Kunci publik disimpan di server dan digunakan untuk verifikasi. Kunci privat hanya tersedia saat penandatanganan.
            </div>
          </div>
        </div>
      )}

      {activeTab==='notifikasi' && (
        <div style={styles.card}>
          <h3 style={{ margin:'0 0 16px',fontSize:14,fontWeight:500 }}>Preferensi Notifikasi Email</h3>
          {[['Invoice berhasil dibuat'],['Invoice berhasil diverifikasi pihak lain'],['Invoice terdeteksi tidak valid'],['Peringatan keamanan akun'],['Ringkasan mingguan invoice']].map(([lbl])=>{
            const [on, setOn] = useState(true);
            return (
              <div key={lbl} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                <span style={{ fontSize:14 }}>{lbl}</span>
                <div onClick={()=>setOn(!on)} style={{ width:40,height:22,borderRadius:11,background:on?COLORS.primary:'var(--color-border-secondary)',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0 }}>
                  <div style={{ position:'absolute',top:3,left:on?20:3,width:16,height:16,borderRadius:'50%',background:'white',transition:'left .2s' }}/>
                </div>
              </div>
            );
          })}
          <button onClick={()=>setToast({msg:'Preferensi notifikasi disimpan',type:'success'})} style={{ ...styles.btn('primary'),marginTop:16 }}>Simpan Preferensi</button>
        </div>
      )}
    </div>
  );
}