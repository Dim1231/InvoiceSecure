import { useEffect, useState } from "react";
import { sha256, simAES256Decrypt, rsaVerify } from '../utils/crypto';
import { COLORS, styles, fmtShort } from '../utils/constants';
import { DB } from '../data/db';

export default function VerifikasiPublik({ uuid }) {
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!uuid) { setErr('UUID tidak valid'); return; }

    const inv = DB.invoices.find(i =>
      i.uuid_invoice === uuid ||
      i.qr_code_url.includes(uuid)
    );

    if (!inv) { setErr('Invoice tidak ditemukan'); return; }

    const decrypted = simAES256Decrypt(inv.data_terenkripsi, 'aes-master-key');
    const reHash = decrypted ? sha256(decrypted) : '';
    const hashMatch = reHash === inv.hash_sha256;
    const rsaOk = rsaVerify(inv.hash_sha256, inv.rsa_signature);

    DB.verifikasi_log.push({
      log_id: DB.nextLogId++,
      invoice_id: inv.invoice_id,
      ip_verifikator: 'publik',
      hash_digunakan: reHash,
      hasil_verifikasi: hashMatch && rsaOk ? 'valid' : 'tidak_valid',
      waktu_verifikasi: new Date().toISOString().slice(0,19).replace('T',' ')
    });

    setResult({ invoice: inv, hashMatch, rsaOk, reHash, ok: hashMatch && rsaOk });
  }, [uuid]);

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-background-tertiary)', fontFamily:"'Segoe UI', sans-serif" }}>
      {/* Navbar */}
      <div style={{ background:COLORS.primaryDark, color:'#fff', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontWeight:700, fontSize:16 }}>InvoiceSecure</div>
        <div style={{ fontSize:12, opacity:.7 }}>Halaman Verifikasi Publik</div>
      </div>

      <div style={{ maxWidth:900, margin:'32px auto', padding:'0 16px' }}>
        <h2 style={{ fontSize:20, fontWeight:500, marginBottom:16 }}>Verifikasi Keaslian Invoice</h2>

        {err && (
          <div style={{ padding:'16px 20px', background:COLORS.dangerLight, color:COLORS.danger, borderRadius:10, fontSize:14 }}>
            ✗ {err}
          </div>
        )}

        {!result && !err && (
          <div style={{ padding:32, textAlign:'center', color:'var(--color-text-secondary)' }}>
            Memverifikasi invoice...
          </div>
        )}

        {result && (
          <div style={{ background:'white', borderRadius:12, border:`2px solid ${result.ok ? COLORS.success : COLORS.danger}`, overflow:'hidden' }}>
            
            {/* Status Banner */}
            <div style={{ padding:'20px 24px', background: result.ok ? COLORS.successLight : COLORS.dangerLight, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:40 }}>{result.ok ? '✅' : '❌'}</div>
              <div>
                <div style={{ fontSize:22, fontWeight:700, color: result.ok ? COLORS.success : COLORS.danger }}>
                  {result.ok ? 'INVOICE VALID' : 'INVOICE TIDAK VALID'}
                </div>
                <div style={{ fontSize:13, color: result.ok ? COLORS.teal : COLORS.danger, marginTop:2 }}>
                  {result.ok
                    ? 'Dokumen asli — tidak mengalami perubahan sejak diterbitkan'
                    : 'Dokumen terdeteksi telah dimodifikasi atau tanda tangan tidak sah'}
                </div>
              </div>
            </div>

            <div style={{ padding:'20px 24px' }}>
              <div style={{ display:'grid', gridTemplateColumns:window.innerWidth<768?'1fr':'1fr 1fr', gap:20, marginBottom:20 }}>
                
                {/* Detail Invoice */}
                <div>
                  <h4 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600 }}>Detail Invoice</h4>
                  {[
                    ['No. Invoice', result.invoice.nomor_invoice],
                    ['Tanggal Terbit', result.invoice.tanggal_invoice],
                    ['Penerima', result.invoice.nama_penerima],
                    ['Subtotal', fmtShort(result.invoice.subtotal)],
                    ['Diskon', fmtShort(result.invoice.diskon)],
                    ['PPN', fmtShort(result.invoice.ppn)],
                    ['Total Bayar', fmtShort(result.invoice.total_bayar)],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid #eee', fontSize:13 }}>
                      <span style={{ color:'#666' }}>{k}</span>
                      <span style={{ fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Hash Detail */}
                <div>
                  <h4 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600 }}>Detail Verifikasi Kriptografi</h4>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, color:'#666', marginBottom:3 }}>Hash SHA-256 Tersimpan:</div>
                    <code style={{ fontSize:10, wordBreak:'break-all', color:COLORS.primary, display:'block', padding:'6px 8px', background:'#f5f5f5', borderRadius:4 }}>
                      {result.invoice.hash_sha256}
                    </code>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'#666', marginBottom:3 }}>Hash SHA-256 Dihitung Ulang:</div>
                    <code style={{ fontSize:10, wordBreak:'break-all', color: result.hashMatch ? COLORS.success : COLORS.danger, display:'block', padding:'6px 8px', background:'#f5f5f5', borderRadius:4 }}>
                      {result.reHash || '(gagal)'}
                    </code>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      ['Hash SHA-256 Cocok', result.hashMatch, 'Integritas data terjaga'],
                      ['Tanda Tangan RSA Sah', result.rsaOk, 'Autentikasi valid'],
                    ].map(([lbl, ok, desc]) => (
                      <div key={lbl} style={{ padding:'10px 12px', background: ok ? COLORS.successLight : COLORS.dangerLight, borderRadius:8 }}>
                        <div style={{ fontSize:12, fontWeight:600, color: ok ? COLORS.success : COLORS.danger }}>
                          {ok ? '✓' : '✗'} {lbl}
                        </div>
                        <div style={{ fontSize:11, color: ok ? COLORS.teal : COLORS.danger, marginTop:2 }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Items */}
              <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:600 }}>Daftar Item Invoice</h4>
              <div style={{ overflowX:'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>{['No','Nama Item','Qty','Satuan','Harga Satuan','Total'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.invoice.items.map((it,i)=>(
                      <tr key={i}>
                        <td style={styles.td}>{i+1}</td>
                        <td style={styles.td}><strong style={{fontWeight:500}}>{it.nama_item}</strong></td>
                        <td style={styles.td}>{it.qty}</td>
                        <td style={styles.td}>{it.satuan||'unit'}</td>
                        <td style={styles.td}>{fmtShort(it.harga_satuan)}</td>
                        <td style={styles.td}>{fmtShort(it.qty*it.harga_satuan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop:12, fontSize:12, color:'#999' }}>
                Waktu verifikasi: {new Date().toLocaleString('id-ID')} — UUID: {result.invoice.uuid_invoice}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}