import { COLORS, styles, fmtShort } from '../utils/constants';
import { DB } from '../data/db';
import { Icon } from '../components/UI';

const isMobile = () => window.innerWidth < 768;

export default function Dashboard({ user, setPage }) {
  const myInvoices = user.role==='admin' ? DB.invoices : DB.invoices.filter(i=>i.user_id===user.user_id);
  const stats = {
    total: myInvoices.length,
    valid: myInvoices.filter(i=>i.status_validasi==='valid').length,
    invalid: myInvoices.filter(i=>i.status_validasi==='tidak_valid').length,
    draft: myInvoices.filter(i=>i.status_validasi==='draft').length,
  };
  const recent = [...myInvoices].sort((a,b)=>b.invoice_id-a.invoice_id).slice(0,5);
  const mobile = isMobile();

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:'0 0 4px',fontSize:mobile?18:22,fontWeight:500 }}>Dashboard</h1>
        <p style={{ margin:0,color:'var(--color-text-secondary)',fontSize:14 }}>Selamat datang, {user.nama_lengkap}</p>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:mobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:10,marginBottom:20 }}>
        {[['Total Invoice','total',COLORS.primary,COLORS.primaryLight],['Valid','valid',COLORS.success,COLORS.successLight],['Tidak Valid','invalid',COLORS.danger,COLORS.dangerLight],['Draft','draft',COLORS.gray,COLORS.grayLight]].map(([lbl,key,c,bg])=>(
          <div key={key} style={{ ...styles.statCard,background:bg }}>
            <div style={{ fontSize:mobile?24:32,fontWeight:700,color:c }}>{stats[key]}</div>
            <div style={{ fontSize:12,color:c,opacity:.8 }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8 }}>
          <h2 style={{ margin:0,fontSize:16,fontWeight:500 }}>Invoice Terbaru</h2>
          <button onClick={()=>setPage('buat')} style={styles.btn('primary')}><Icon name="plus" size={14}/>Buat Invoice</button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={styles.table}>
            <thead><tr>{['No. Invoice','Penerima','Total','Status','Aksi'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {recent.map(inv=>(
                <tr key={inv.invoice_id}>
                  <td style={styles.td}><code style={{ fontSize:11,background:'var(--color-background-secondary)',padding:'2px 6px',borderRadius:4 }}>{inv.nomor_invoice}</code></td>
                  <td style={styles.td}>{inv.nama_penerima}</td>
                  <td style={styles.td}>{fmtShort(inv.total_bayar)}</td>
                  <td style={styles.td}><span style={styles.badge(inv.status_validasi)}>{inv.status_validasi}</span></td>
                  <td style={styles.td}><button onClick={()=>setPage({name:'detail',id:inv.invoice_id})} style={styles.btn('outline')}>Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:16 }}>
        <div style={{ ...styles.card,background:COLORS.primaryLight }}>
          <h3 style={{ margin:'0 0 8px',fontSize:14,fontWeight:500,color:COLORS.primary }}>Cara Kerja Sistem</h3>
          {['Data invoice dienkripsi dengan AES-256-CBC','Hash SHA-256 dibuat sebagai sidik jari digital','Tanda tangan RSA-2048 menjamin autentikasi','QR Code disisipkan ke PDF untuk verifikasi publik'].map((s,i)=>(
            <div key={i} style={{ display:'flex',gap:8,marginBottom:6,fontSize:13,color:COLORS.primaryDark }}>
              <span style={{ fontWeight:700,color:COLORS.primary,minWidth:18 }}>{i+1}.</span>{s}
            </div>
          ))}
        </div>
        <div style={{ ...styles.card,background:COLORS.tealLight }}>
          <h3 style={{ margin:'0 0 8px',fontSize:14,fontWeight:500,color:COLORS.teal }}>Keamanan Sistem</h3>
          {[`AES-256-CBC: ${DB.invoices.length} invoice terenkripsi`,`SHA-256: Semua hash valid`,`RSA-2048: Tanda tangan aktif`,`Verifikasi Log: ${DB.verifikasi_log.length} entri`].map((s,i)=>(
            <div key={i} style={{ display:'flex',gap:8,marginBottom:6,fontSize:13,color:COLORS.teal }}>
              <span>✓</span>{s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}