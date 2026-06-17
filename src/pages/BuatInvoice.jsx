import { useState, useEffect } from "react";
import { sha256, rsaSign, simAES256Encrypt, simAES256Decrypt, rsaVerify, uuidv4, generateQRDataURL, generateInvoicePDF } from '../utils/crypto';
import { COLORS, styles, fmtShort } from '../utils/constants';
import { DB } from '../data/db';
import { Icon } from '../components/UI';
import { saveInvoice, saveLog } from '../utils/firebase';

// ── QR Code Image Component (async real QR) ───────────────────────────────────
function QRImg({ url, size=150 }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (url) generateQRDataURL(url, size).then(setSrc);
  }, [url, size]);
  return src
    ? <img src={src} alt="QR Code" style={{ width:size, height:size, display:'block' }}/>
    : <div style={{ width:size, height:size, background:'var(--color-background-secondary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--color-text-secondary)', borderRadius:4 }}>Generating QR...</div>;
}

// ── Invoice Detail ─────────────────────────────────────────────────────────────
export function InvoiceDetail({ invoice, user, onBack }) {
  const [showCrypto, setShowCrypto] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const owner = DB.users.find(u=>u.user_id===invoice.user_id);

  const verifyNow = async () => {
  const decrypted = simAES256Decrypt(invoice.data_terenkripsi, 'aes-master-key');
  if (!decrypted) { setVerifyResult({ok:false, msg:'Gagal dekripsi data'}); return; }
  const reHash = sha256(decrypted);
  const hashMatch = reHash === invoice.hash_sha256;
  const rsaOk = rsaVerify(invoice.hash_sha256, invoice.rsa_signature);
  setVerifyResult({ ok: hashMatch && rsaOk, hashMatch, rsaOk, reHash });
  const logEntry = {
    log_id: DB.nextLogId++,
    invoice_id: invoice.invoice_id,
    ip_verifikator: '127.0.0.1',
    hash_digunakan: reHash,
    hasil_verifikasi: hashMatch&&rsaOk ? 'valid' : 'tidak_valid',
    waktu_verifikasi: new Date().toISOString().slice(0,19).replace('T',' ')
  };
  DB.verifikasi_log.push(logEntry);
  await saveLog(logEntry);
};

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await generateInvoicePDF(invoice, owner?.nama_perusahaan || owner?.nama_lengkap);
    } catch(e) {
      alert('Gagal generate PDF: ' + e.message);
    }
    setDownloading(false);
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={onBack} style={styles.btn('outline')}>← Kembali</button>
        <h1 style={{ margin:0, fontSize:22, fontWeight:500 }}>Detail Invoice</h1>
        <span style={styles.badge(invoice.status_validasi)}>{invoice.status_validasi}</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={handleDownloadPDF} disabled={downloading} style={styles.btn('primary')}>
            <Icon name="download" size={13}/>{downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, marginBottom:16 }}>
        <div style={styles.card}>
          <div style={{ display:'grid', gridTemplateColumns:window.innerWidth<768?'1fr':'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color:COLORS.primary, marginBottom:4 }}>{invoice.nomor_invoice}</div>
              <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>Diterbitkan: {invoice.tanggal_invoice}</div>
              <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>Oleh: {owner?.nama_perusahaan||owner?.nama_lengkap}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:22, fontWeight:700, color:COLORS.primary }}>{fmtShort(invoice.total_bayar)}</div>
              <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>Total Bayar (incl. PPN {invoice.ppn_persen}%)</div>
            </div>
          </div>

          <div style={{ padding:'12px 16px', background:'var(--color-background-secondary)', borderRadius:8, marginBottom:16 }}>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:2 }}>Penerima</div>
            <div style={{ fontWeight:500 }}>{invoice.nama_penerima}</div>
            {invoice.email_penerima && <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{invoice.email_penerima}</div>}
          </div>

          <table style={styles.table}>
            <thead>
              <tr>{['No','Nama Item','Deskripsi','Qty','Satuan','Harga Satuan','Total'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {invoice.items.map((it,i)=>(
                <tr key={i}>
                  <td style={styles.td}>{i+1}</td>
                  <td style={styles.td}><strong style={{fontWeight:500}}>{it.nama_item}</strong></td>
                  <td style={{...styles.td,color:'var(--color-text-secondary)',fontSize:12}}>{it.deskripsi}</td>
                  <td style={styles.td}>{it.qty}</td>
                  <td style={styles.td}>{it.satuan}</td>
                  <td style={styles.td}>{fmtShort(it.harga_satuan)}</td>
                  <td style={styles.td} align="right">{fmtShort(it.qty*it.harga_satuan*(1-(it.diskon_item||0)/100))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop:16, paddingTop:16, borderTop:'0.5px solid var(--color-border-tertiary)' }}>
            {[['Subtotal',invoice.subtotal],['Diskon',-invoice.diskon],['PPN',invoice.ppn],['Total Bayar',invoice.total_bayar]].map(([lbl,val])=>(
              <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontWeight:lbl==='Total Bayar'?700:400, fontSize:lbl==='Total Bayar'?16:14, borderTop:lbl==='Total Bayar'?'1px solid var(--color-border-tertiary)':'none', marginTop:lbl==='Total Bayar'?8:0 }}>
                <span style={{ color:'var(--color-text-secondary)' }}>{lbl}</span>
                <span style={{ color:lbl==='Total Bayar'?COLORS.primary:lbl==='Diskon'?COLORS.danger:'var(--color-text-primary)' }}>
                  {lbl==='Diskon'?`-${fmtShort(-val)}`:fmtShort(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Panel */}
        <div style={{ width:220 }}>
          <div style={{ ...styles.card, textAlign:'center' }}>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:8, fontWeight:500 }}>QR Code Verifikasi</div>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
              <QRImg url={invoice.qr_code_url} size={150}/>
            </div>
            <div style={{ fontSize:10, color:'var(--color-text-secondary)', marginBottom:12, wordBreak:'break-all', padding:'4px 8px', background:'var(--color-background-secondary)', borderRadius:4 }}>
              {invoice.qr_code_url.slice(0,45)}...
            </div>
            <button onClick={verifyNow} style={{ ...styles.btn('success'), width:'100%', justifyContent:'center' }}>
              <Icon name="check" size={13}/>Verifikasi Sekarang
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading} style={{ ...styles.btn('outline'), width:'100%', justifyContent:'center', marginTop:8 }}>
              <Icon name="download" size={13}/>{downloading?'Loading...':'Download PDF'}
            </button>
          </div>

          {verifyResult && (
            <div style={{ ...styles.card, background:verifyResult.ok?COLORS.successLight:COLORS.dangerLight, borderColor:verifyResult.ok?COLORS.success:COLORS.danger }}>
              <div style={{ fontWeight:700, color:verifyResult.ok?COLORS.success:COLORS.danger, marginBottom:8, fontSize:14 }}>
                {verifyResult.ok ? '✓ INVOICE VALID' : '✗ INVOICE TIDAK VALID'}
              </div>
              <div style={{ fontSize:12 }}>
                <div style={{ color:verifyResult.hashMatch?COLORS.teal:COLORS.danger }}>
                  {verifyResult.hashMatch?'✓':'✗'} Hash SHA-256: {verifyResult.hashMatch?'Cocok':'Tidak cocok'}
                </div>
                <div style={{ color:verifyResult.rsaOk?COLORS.teal:COLORS.danger, marginTop:4 }}>
                  {verifyResult.rsaOk?'✓':'✗'} Tanda Tangan RSA: {verifyResult.rsaOk?'Valid':'Tidak valid'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crypto Detail */}
      <div style={styles.card}>
        <button onClick={()=>setShowCrypto(!showCrypto)} style={{ ...styles.btn('outline'), marginBottom:showCrypto?16:0 }}>
          <Icon name="lock" size={13}/> {showCrypto?'Sembunyikan':'Tampilkan'} Detail Kriptografi
        </button>
        {showCrypto && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              ['SHA-256 Hash', invoice.hash_sha256, 'Sidik jari digital invoice (256-bit). Berubah jika ada 1 karakter yang dimodifikasi.'],
              ['Tanda Tangan RSA', invoice.rsa_signature, `m=${parseInt(invoice.hash_sha256.slice(0,6),16)%3233}, S=m^2753 mod 3233. Hanya pemilik kunci privat yang bisa membuat ini.`],
              ['AES-256 Encrypted', invoice.data_terenkripsi.slice(0,60)+'...', 'Data invoice terenkripsi AES-256-CBC. Tidak bisa dibaca tanpa kunci.'],
            ].map(([title,val,desc])=>(
              <div key={title} style={{ padding:12, background:'var(--color-background-secondary)', borderRadius:8 }}>
                <div style={{ fontSize:11, fontWeight:600, color:COLORS.primary, marginBottom:4 }}>{title}</div>
                <code style={{ fontSize:10, wordBreak:'break-all', color:'var(--color-text-secondary)', display:'block', marginBottom:6 }}>{val}</code>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', lineHeight:1.4 }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Buat Invoice ───────────────────────────────────────────────────────────────
export default function BuatInvoice({ user, onSave, setPage }) {
  const initItem = () => ({ id:uuidv4(), nama_item:'', deskripsi:'', qty:1, satuan:'unit', harga_satuan:0, diskon_item:0 });
  const [form, setForm] = useState({
    nomor: `INV-2026-0${String(DB.nextInvoiceId).padStart(2,'0')}`,
    tanggal: new Date().toISOString().slice(0,10),
    nama_penerima:'', email_penerima:'', alamat_penerima:'', catatan:'',
    diskon_persen:0, ppn_persen:11
  });
  const [items, setItems] = useState([initItem()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const subtotal = items.reduce((s,it)=>s+(it.qty*it.harga_satuan*(1-it.diskon_item/100)),0);
  const diskon = subtotal*form.diskon_persen/100;
  const ppn = (subtotal-diskon)*form.ppn_persen/100;
  const total = subtotal-diskon+ppn;

  const updateItem = (id,field,val) => setItems(prev=>prev.map(it=>it.id===id?{...it,[field]:val}:it));

  const handleSave = async () => {
    if (!form.nama_penerima) { setErr('Nama penerima wajib diisi'); return; }
    if (items.some(it=>!it.nama_item)) { setErr('Nama item wajib diisi'); return; }
    setLoading(true); setErr('');
    await new Promise(r=>setTimeout(r,900));

    const dataObj = { ...form, items, subtotal, diskon, ppn, total, user_id:user.user_id };
    const dataStr = JSON.stringify(dataObj);
    const hash = sha256(dataStr);
    const sig = rsaSign(hash);
    const uuid = uuidv4();
    const encrypted = simAES256Encrypt(dataStr, 'aes-master-key');

    const invoice = {
      invoice_id: DB.nextInvoiceId++,
      user_id: user.user_id,
      uuid_invoice: uuid,
      nomor_invoice: form.nomor,
      tanggal_invoice: form.tanggal,
      nama_penerima: form.nama_penerima,
      email_penerima: form.email_penerima,
      items,
      subtotal, diskon, diskon_persen:form.diskon_persen, ppn, ppn_persen:form.ppn_persen,
      total_bayar: total,
      hash_sha256: hash,
      rsa_signature: sig,
      data_terenkripsi: encrypted,
      qr_code_url: `https://invoice-secure.vercel.app/verify/${uuid}`,
      status_validasi: 'valid',
      tanggal_dibuat: new Date().toISOString().slice(0,19).replace('T',' '),
      catatan: form.catatan,
    };
    DB.invoices.push(invoice);
    await saveInvoice(invoice);
    setResult(invoice);
    setLoading(false);
    onSave();
  };

  if (result) return <InvoiceDetail invoice={result} user={user} onBack={()=>setPage('riwayat')} />;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={()=>setPage('dashboard')} style={styles.btn('outline')}>← Kembali</button>
        <h1 style={{ margin:0, fontSize:22, fontWeight:500 }}>Buat Invoice Baru</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:window.innerWidth<768?'1fr':'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={styles.card}>
          <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:500 }}>Informasi Invoice</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['Nomor Invoice','nomor','text'],['Tanggal Invoice','tanggal','date']].map(([lbl,key,type])=>(
              <div key={key}>
                <label style={styles.label}>{lbl}</label>
                <input style={styles.input} type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12 }}>
            <label style={styles.label}>Nama Penerima *</label>
            <input style={styles.input} value={form.nama_penerima} onChange={e=>setForm(f=>({...f,nama_penerima:e.target.value}))} placeholder="PT / CV / Nama individu"/>
          </div>
          <div style={{ marginTop:12 }}>
            <label style={styles.label}>Email Penerima</label>
            <input style={styles.input} type="email" value={form.email_penerima} onChange={e=>setForm(f=>({...f,email_penerima:e.target.value}))} placeholder="email@penerima.com"/>
          </div>
          <div style={{ marginTop:12 }}>
            <label style={styles.label}>Catatan (opsional)</label>
            <textarea style={{...styles.input,height:64,resize:'vertical'}} value={form.catatan} onChange={e=>setForm(f=>({...f,catatan:e.target.value}))} placeholder="Syarat pembayaran, catatan tambahan..."/>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:500 }}>Ringkasan Pembayaran</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={styles.label}>Diskon (%)</label>
              <input style={styles.input} type="number" min="0" max="100" value={form.diskon_persen} onChange={e=>setForm(f=>({...f,diskon_persen:+e.target.value}))}/>
            </div>
            <div>
              <label style={styles.label}>PPN (%)</label>
              <input style={styles.input} type="number" min="0" max="100" value={form.ppn_persen} onChange={e=>setForm(f=>({...f,ppn_persen:+e.target.value}))}/>
            </div>
          </div>
          {[['Subtotal',subtotal],['Diskon',-diskon],['PPN',ppn],['Total Bayar',total]].map(([lbl,val])=>(
            <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:lbl==='Total Bayar'?'none':'0.5px solid var(--color-border-tertiary)', fontWeight:lbl==='Total Bayar'?700:400, fontSize:lbl==='Total Bayar'?16:14, color:lbl==='Total Bayar'?COLORS.primary:lbl==='Diskon'?COLORS.danger:'var(--color-text-primary)' }}>
              <span>{lbl}</span>
              <span>{lbl==='Diskon'?`-${fmtShort(-val)}`:fmtShort(val)}</span>
            </div>
          ))}

          <div style={{ marginTop:16, padding:12, background:COLORS.primaryLight, borderRadius:8, fontSize:12, color:COLORS.primary }}>
            <div style={{ fontWeight:600, marginBottom:6 }}>Proses Otomatis Setelah Simpan:</div>
            {[
              '1. Data dienkripsi AES-256-CBC',
              '2. Hash SHA-256 digenerate (sidik jari)',
              '3. RSA menandatangani hash (kunci privat)',
              '4. QR Code asli (scannable) dibuat',
              '5. PDF siap untuk didownload'
            ].map(s=><div key={s} style={{ marginBottom:2 }}>→ {s}</div>)}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={styles.card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:14, fontWeight:500 }}>Daftar Item</h3>
          <button onClick={()=>setItems(prev=>[...prev,initItem()])} style={styles.btn('outline')}><Icon name="plus" size={13}/>Tambah Item</button>
        </div>
        <table style={{...styles.table,marginBottom:0}}>
          <thead>
            <tr>{['Nama Item','Deskripsi','Qty','Satuan','Harga Satuan','Diskon%','Subtotal',''].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map(it=>(
              <tr key={it.id}>
                <td style={styles.td}><input style={{...styles.input,width:140}} value={it.nama_item} onChange={e=>updateItem(it.id,'nama_item',e.target.value)} placeholder="Nama item"/></td>
                <td style={styles.td}><input style={{...styles.input,width:120}} value={it.deskripsi} onChange={e=>updateItem(it.id,'deskripsi',e.target.value)} placeholder="Deskripsi"/></td>
                <td style={styles.td}><input style={{...styles.input,width:60}} type="number" min="1" value={it.qty} onChange={e=>updateItem(it.id,'qty',+e.target.value)}/></td>
                <td style={styles.td}><input style={{...styles.input,width:70}} value={it.satuan} onChange={e=>updateItem(it.id,'satuan',e.target.value)}/></td>
                <td style={styles.td}><input style={{...styles.input,width:120}} type="number" min="0" value={it.harga_satuan} onChange={e=>updateItem(it.id,'harga_satuan',+e.target.value)}/></td>
                <td style={styles.td}><input style={{...styles.input,width:60}} type="number" min="0" max="100" value={it.diskon_item} onChange={e=>updateItem(it.id,'diskon_item',+e.target.value)}/></td>
                <td style={styles.td} align="right">{fmtShort(it.qty*it.harga_satuan*(1-it.diskon_item/100))}</td>
                <td style={styles.td}>
                  <button onClick={()=>setItems(prev=>prev.filter(i=>i.id!==it.id))} style={{background:'none',border:'none',cursor:'pointer',color:COLORS.danger,padding:4}} disabled={items.length===1}>
                    <Icon name="trash" size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {err && <div style={{color:COLORS.danger,fontSize:13,marginBottom:12,padding:'8px 12px',background:COLORS.dangerLight,borderRadius:8}}>{err}</div>}

      <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
        <button onClick={()=>setPage('dashboard')} style={styles.btn('outline')}>Batal</button>
        <button onClick={handleSave} disabled={loading} style={styles.btn('primary')}>
          {loading
            ? <><span style={{animation:'spin 1s linear infinite',display:'inline-block',width:14,height:14,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%'}}/>Memproses...</>
            : <><Icon name="shield" size={14}/>Buat Invoice & Tandatangani</>
          }
        </button>
      </div>
    </div>
  );
}
