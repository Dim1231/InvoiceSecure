import { useState } from "react";
import { sha256 } from '../utils/crypto';
import { COLORS, styles } from '../utils/constants';
import { DB } from '../data/db';
import { Icon, Modal, Toast } from '../components/UI';
import { saveUser } from '../utils/firebase';

export function AdminPengguna() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ nama:'', email:'', pass:'', role:'user' });
  const [toast, setToast] = useState(null);
  const mobile = window.innerWidth < 768;

  const toggleStatus = async (id) => {
    const u = DB.users.find(u=>u.user_id===id);
    if (u) {
      u.status = u.status==='aktif'?'nonaktif':'aktif';
      await saveUser(u);
    }
    setToast({ msg:'Status pengguna diperbarui', type:'success' });
  };

  const filtered = DB.users.filter(u=>!search||u.nama_lengkap.toLowerCase().includes(search.toLowerCase())||u.email.includes(search));

  return (
    <div>
      {toast && <Toast {...toast} onDone={()=>setToast(null)} />}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:8 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:500 }}>Manajemen Pengguna</h1>
        <button onClick={()=>setShowAdd(true)} style={styles.btn('primary')}><Icon name="plus" size={14}/>Tambah Pengguna</button>
      </div>

      <div style={{ marginBottom:16 }}>
        <input style={styles.input} placeholder="Cari nama atau email..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div style={styles.card}>
        <div style={{ overflowX:'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>{(mobile?['Nama','Status','Aksi']:['ID','Nama Lengkap','Email','Perusahaan','Role','Status','Tgl. Daftar','Aksi']).map(h=><th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(u=>(
                <tr key={u.user_id}>
                  {mobile ? (
                    <>
                      <td style={styles.td}>
                        <div style={{ fontWeight:500 }}>{u.nama_lengkap}</div>
                        <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{u.email}</div>
                      </td>
                      <td style={styles.td}><span style={styles.badge(u.status==='aktif'?'valid':'invalid')}>{u.status}</span></td>
                      <td style={styles.td}>
                        <button onClick={()=>toggleStatus(u.user_id)} style={styles.btn(u.status==='aktif'?'danger':'outline')}>
                          {u.status==='aktif'?'Nonaktifkan':'Aktifkan'}
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={styles.td}>{u.user_id}</td>
                      <td style={styles.td}><strong style={{ fontWeight:500 }}>{u.nama_lengkap}</strong></td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>{u.nama_perusahaan}</td>
                      <td style={styles.td}><span style={styles.badge(u.role)}>{u.role}</span></td>
                      <td style={styles.td}><span style={styles.badge(u.status==='aktif'?'valid':'invalid')}>{u.status}</span></td>
                      <td style={styles.td}>{u.created_at}</td>
                      <td style={styles.td}>
                        <button onClick={()=>toggleStatus(u.user_id)} style={styles.btn(u.status==='aktif'?'danger':'outline')}>
                          {u.status==='aktif'?'Nonaktifkan':'Aktifkan'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'8px 0', fontSize:13, color:'var(--color-text-secondary)' }}>
          Menampilkan {filtered.length} dari {DB.users.length} pengguna
        </div>
      </div>

      {showAdd && (
        <Modal title="Tambah Pengguna Baru" onClose={()=>setShowAdd(false)}>
          {[['Nama Lengkap','nama','text'],['Email','email','email'],['Password','pass','password']].map(([lbl,key,type])=>(
            <div key={key} style={{ marginBottom:14 }}>
              <label style={styles.label}>{lbl}</label>
              <input style={styles.input} type={type} value={newUser[key]} onChange={e=>setNewUser(u=>({...u,[key]:e.target.value}))} />
            </div>
          ))}
          <div style={{ marginBottom:16 }}>
            <label style={styles.label}>Role</label>
            <select style={styles.input} value={newUser.role} onChange={e=>setNewUser(u=>({...u,role:e.target.value}))}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={()=>setShowAdd(false)} style={styles.btn('outline')}>Batal</button>
            <button onClick={async ()=>{
              if (!newUser.nama||!newUser.email||!newUser.pass) return;
              const u = { user_id:DB.nextUserId++, nama_lengkap:newUser.nama, email:newUser.email, password_hash:sha256(newUser.pass), nama_perusahaan:'-', role:newUser.role, status:'aktif', created_at:new Date().toISOString().slice(0,10) };
              DB.users.push(u);
              await saveUser(u);
              setShowAdd(false);
              setToast({msg:'Pengguna berhasil ditambahkan',type:'success'});
            }} style={styles.btn('primary')}>Tambah</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function AdminLog() {
  const logs = [...DB.verifikasi_log].reverse();
  const invoices = DB.invoices;
  const mobile = window.innerWidth < 768;

  return (
    <div>
      <h1 style={{ margin:'0 0 24px', fontSize:22, fontWeight:500 }}>Log Sistem</h1>

      <div style={{ display:'grid', gridTemplateColumns: mobile?'1fr':'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          ['Total Verifikasi', logs.length, COLORS.primary, COLORS.primaryLight],
          ['Verifikasi Valid', logs.filter(l=>l.hasil_verifikasi==='valid').length, COLORS.success, COLORS.successLight],
          ['Verifikasi Gagal', logs.filter(l=>l.hasil_verifikasi==='tidak_valid').length, COLORS.danger, COLORS.dangerLight]
        ].map(([lbl,val,c,bg])=>(
          <div key={lbl} style={{ ...styles.statCard, background:bg }}>
            <div style={{ fontSize:28, fontWeight:700, color:c }}>{val}</div>
            <div style={{ fontSize:13, color:c, opacity:.8 }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:500 }}>Log Verifikasi</h3>
        {logs.length === 0 ? (
          <div style={{ textAlign:'center', padding:32, color:'var(--color-text-secondary)', fontSize:14 }}>
            Belum ada log verifikasi.
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>{['Log ID','Invoice','IP Verifikator','Hash Digunakan','Hasil','Waktu'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {logs.map((log,idx)=>{
                  const inv = invoices.find(i=>i.invoice_id===log.invoice_id);
                  return (
                    <tr key={idx}>
                      <td style={styles.td}>{log.log_id}</td>
                      <td style={styles.td}><code style={{ fontSize:11 }}>{inv?.nomor_invoice||'N/A'}</code></td>
                      <td style={styles.td}>{log.ip_verifikator}</td>
                      <td style={styles.td}><code style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{log.hash_digunakan?.slice(0,16)}...</code></td>
                      <td style={styles.td}><span style={styles.badge(log.hasil_verifikasi==='valid'?'valid':'invalid')}>{log.hasil_verifikasi}</span></td>
                      <td style={styles.td}>{log.waktu_verifikasi}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}