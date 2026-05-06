import { useState } from "react";
import { styles, fmtShort } from '../utils/constants';
import { generateInvoicePDF } from '../utils/crypto';
import { DB } from '../data/db';
import { Icon } from '../components/UI';
import { InvoiceDetail } from './BuatInvoice';

export default function RiwayatInvoice({ user, setPage }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  if (selectedInvoice) return <InvoiceDetail invoice={selectedInvoice} user={user} onBack={()=>setSelectedInvoice(null)}/>;

  const list = (user.role==='admin' ? DB.invoices : DB.invoices.filter(i=>i.user_id===user.user_id))
    .filter(i => filterStatus==='semua' || i.status_validasi===filterStatus)
    .filter(i => !search || i.nomor_invoice.includes(search) || i.nama_penerima.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>b.invoice_id-a.invoice_id);

  const handleDownload = async (inv) => {
    setDownloadingId(inv.invoice_id);
    try {
      const owner = DB.users.find(u=>u.user_id===inv.user_id);
      await generateInvoicePDF(inv, owner?.nama_perusahaan||owner?.nama_lengkap);
    } catch(e) { alert('Gagal download: '+e.message); }
    setDownloadingId(null);
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:500 }}>{user.role==='admin'?'Semua Invoice':'Riwayat Invoice'}</h1>
        <button onClick={()=>setPage('buat')} style={styles.btn('primary')}><Icon name="plus" size={14}/>Buat Invoice Baru</button>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <div style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-secondary)' }}><Icon name="search" size={14}/></span>
          <input style={{...styles.input,paddingLeft:34}} placeholder="Cari nomor invoice atau nama penerima..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select style={{...styles.input,width:160}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="semua">Semua Status</option>
          <option value="valid">Valid</option>
          <option value="tidak_valid">Tidak Valid</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['No. Invoice', user.role==='admin'?'Pemilik':'', 'Penerima','Tanggal','Total','Hash SHA-256','Status','Aksi']
                .filter(Boolean).map(h=><th key={h} style={styles.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.length===0 && (
              <tr><td colSpan="8" style={{...styles.td,textAlign:'center',color:'var(--color-text-secondary)',padding:32}}>Tidak ada invoice ditemukan</td></tr>
            )}
            {list.map(inv=>{
              const owner = DB.users.find(u=>u.user_id===inv.user_id);
              return (
                <tr key={inv.invoice_id}>
                  <td style={styles.td}><code style={{fontSize:12,background:'var(--color-background-secondary)',padding:'2px 6px',borderRadius:4}}>{inv.nomor_invoice}</code></td>
                  {user.role==='admin' && <td style={styles.td}><span style={{fontSize:13}}>{owner?.nama_lengkap}</span></td>}
                  <td style={styles.td}>{inv.nama_penerima}</td>
                  <td style={styles.td}>{inv.tanggal_invoice}</td>
                  <td style={styles.td}>{fmtShort(inv.total_bayar)}</td>
                  <td style={styles.td}><code style={{fontSize:10,color:'var(--color-text-secondary)'}}>{inv.hash_sha256.slice(0,12)}...</code></td>
                  <td style={styles.td}><span style={styles.badge(inv.status_validasi)}>{inv.status_validasi}</span></td>
                  <td style={styles.td}>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>setSelectedInvoice(inv)} style={styles.btn('outline')}>Detail</button>
                      <button
                        onClick={()=>handleDownload(inv)}
                        disabled={downloadingId===inv.invoice_id}
                        style={styles.btn('ghost')}
                        title="Download PDF"
                      >
                        {downloadingId===inv.invoice_id ? '...' : <Icon name="download" size={13}/>}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{padding:'12px 0',fontSize:13,color:'var(--color-text-secondary)'}}>Menampilkan {list.length} invoice</div>
      </div>
    </div>
  );
}
