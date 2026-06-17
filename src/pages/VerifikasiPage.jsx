import { useState, useRef, useEffect, useCallback } from "react";
import { sha256, simAES256Decrypt, rsaVerify, extractUUIDFromPDF } from '../utils/crypto';
import { COLORS, styles, fmtShort } from '../utils/constants';
import { DB } from '../data/db';
import { Icon } from '../components/UI';
import { getInvoiceByUUID, saveLog } from '../utils/firebase';

// ── Verifikasi Page ───────────────────────────────────────────────────────────
export default function VerifikasiPage() {
  const [tab, setTab] = useState('manual');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraErr, setCameraErr] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);

  // PDF state
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ── Core verify logic ──────────────────────────────────────────────────────
  const doVerify = useCallback(async (id) => {
    setErr(''); setResult(null);
    if (!id?.trim()) { setErr('Masukkan nomor invoice atau UUID'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    const inv = DB.invoices.find(i =>
      i.nomor_invoice === id.trim() ||
      i.uuid_invoice === id.trim() ||
      i.qr_code_url.includes(id.trim())
    );

    if (!inv) {
      setErr(`Invoice tidak ditemukan (404) — ID: "${id.trim()}"`);
      setLoading(false);
      return;
    }

    const decrypted = simAES256Decrypt(inv.data_terenkripsi, 'aes-master-key');
    const reHash = decrypted ? sha256(decrypted) : '';
    const hashMatch = reHash === inv.hash_sha256;
    const rsaOk = rsaVerify(inv.hash_sha256, inv.rsa_signature);

const logEntry = {
  log_id: DB.nextLogId++,
  invoice_id: inv.invoice_id,
  ip_verifikator: '127.0.0.1',
  hash_digunakan: reHash,
  hasil_verifikasi: hashMatch && rsaOk ? 'valid' : 'tidak_valid',
  waktu_verifikasi: new Date().toISOString().slice(0,19).replace('T',' ')
};
DB.verifikasi_log.push(logEntry);
await saveLog(logEntry);;

    setResult({ invoice: inv, hashMatch, rsaOk, reHash, ok: hashMatch && rsaOk });
    setLoading(false);
  }, []);

  // ── Manual verify ──────────────────────────────────────────────────────────
  const handleManualVerify = () => {
    setInput(v => { doVerify(v); return v; });
  };

  // ── Camera scan ────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraErr(''); setScanStatus('Membuka kamera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setScanStatus('Arahkan kamera ke QR Code...');
      startScanLoop();
    } catch (e) {
      setCameraErr('Tidak dapat mengakses kamera: ' + e.message);
      setScanStatus('');
    }
  };

  const stopCamera = () => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanStatus('');
  };

  const startScanLoop = async () => {
    let jsQR;
    try {
      const mod = await import('jsqr');
      jsQR = mod.default;
    } catch {
      setCameraErr('Library jsQR tidak tersedia. Pastikan sudah npm install.');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const scan = () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code?.data) {
          setScanStatus('✓ QR Code terdeteksi! Memverifikasi...');
          stopCamera();
          processQRResult(code.data);
          return;
        }
      }
      animRef.current = requestAnimationFrame(scan);
    };
    animRef.current = requestAnimationFrame(scan);
  };

  const processQRResult = (data) => {
    // Extract UUID from URL: https://invoicesecure.id/verify/{uuid}
    const uuidMatch = data.match(/verify\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    // Or INV number
    const invMatch = data.match(/INV-\d{4}-\d+/);

    const id = uuidMatch?.[1] || invMatch?.[0] || data;
    setInput(id);
    setTab('manual');
    doVerify(id);
  };

  // ── PDF Upload ─────────────────────────────────────────────────────────────
  const handlePDFFile = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) {
      setErr('Harap upload file PDF yang valid');
      return;
    }
    setPdfFile(file);
    setPdfLoading(true);
    setErr('');
    setResult(null);

    try {
      const { uuid, nomor } = await extractUUIDFromPDF(file);
      if (uuid) {
        setInput(uuid);
        setTab('manual');
        await doVerify(uuid);
      } else if (nomor) {
        setInput(nomor);
        setTab('manual');
        await doVerify(nomor);
      } else {
        setErr('UUID atau nomor invoice tidak ditemukan dalam PDF ini. Pastikan file PDF berasal dari InvoiceSecure.');
      }
    } catch (e) {
      setErr('Gagal membaca PDF: ' + e.message);
    }
    setPdfLoading(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePDFFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handlePDFFile(file);
  };

  // ── Tab button style ───────────────────────────────────────────────────────
  const tabStyle = (active) => ({
    padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    borderBottom: active ? `2px solid ${COLORS.primary}` : '2px solid transparent',
    background: 'transparent', color: active ? COLORS.primary : 'var(--color-text-secondary)',
    transition: 'all .15s'
  });

  return (
    <div>
      <h1 style={{ margin:'0 0 4px', fontSize:22, fontWeight:500 }}>Verifikasi Invoice</h1>
      <p style={{ margin:'0 0 20px', color:'var(--color-text-secondary)', fontSize:14 }}>
        Verifikasi keaslian invoice menggunakan 3 cara: ID manual, scan QR Code, atau upload PDF
      </p>

      {/* Tabs */}
      <div style={{ ...styles.card, padding:0, marginBottom:16, overflow:'hidden' }}>
        <div style={{ display:'flex', borderBottom:`1px solid var(--color-border-tertiary)`, padding:'0 4px' }}>
          {[
            ['manual', 'search', 'Masukkan ID'],
            ['camera', 'qr', 'Scan QR Code'],
            ['pdf', 'file', 'Upload PDF'],
          ].map(([id, icon, label]) => (
            <button key={id} style={tabStyle(tab===id)} onClick={() => { setTab(id); setResult(null); setErr(''); if(id!=='camera') stopCamera(); }}>
              <Icon name={icon} size={13}/> {label}
            </button>
          ))}
        </div>

        <div style={{ padding:'20px' }}>

          {/* Tab: Manual */}
          {tab === 'manual' && (
            <div>
              <label style={styles.label}>Nomor Invoice atau UUID</label>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  style={{ ...styles.input, flex:1 }}
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  placeholder="Contoh: INV-2026-021 atau xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  onKeyDown={e=>e.key==='Enter'&&handleManualVerify()}
                />
                <button onClick={handleManualVerify} disabled={loading} style={styles.btn('primary')}>
                  {loading ? 'Memverifikasi...' : <><Icon name="check" size={13}/> Verifikasi</>}
                </button>
              </div>
              <p style={{ margin:'8px 0 0', fontSize:12, color:'var(--color-text-secondary)' }}>
                Tip: Masukkan nomor invoice (INV-2026-XXX) atau UUID dari QR Code
              </p>
            </div>
          )}

          {/* Tab: Camera */}
          {tab === 'camera' && (
            <div>
              <div style={{ marginBottom:12, fontSize:13, color:'var(--color-text-secondary)' }}>
                Arahkan kamera ke QR Code yang ada di invoice PDF untuk verifikasi otomatis.
              </div>

              {cameraErr && (
                <div style={{ padding:'10px 14px', background:COLORS.dangerLight, color:COLORS.danger, borderRadius:8, fontSize:13, marginBottom:12 }}>
                  ✗ {cameraErr}
                </div>
              )}

              <div style={{ position:'relative', background:'#000', borderRadius:10, overflow:'hidden', marginBottom:12, maxWidth:480 }}>
                <video
                  ref={videoRef}
                  style={{ width:'100%', display:'block', maxHeight:320 }}
                  muted playsInline
                />
                <canvas ref={canvasRef} style={{ display:'none' }} />

                {/* Overlay scan frame */}
                {cameraActive && (
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                    <div style={{ width:180, height:180, border:'2px solid rgba(100,200,100,0.8)', borderRadius:8, boxShadow:'0 0 0 2000px rgba(0,0,0,0.35)' }}>
                      <div style={{ position:'absolute', top:0, left:0, width:20, height:20, borderTop:'3px solid #4CAF50', borderLeft:'3px solid #4CAF50', borderRadius:'4px 0 0 0' }}/>
                      <div style={{ position:'absolute', top:0, right:0, width:20, height:20, borderTop:'3px solid #4CAF50', borderRight:'3px solid #4CAF50', borderRadius:'0 4px 0 0' }}/>
                      <div style={{ position:'absolute', bottom:0, left:0, width:20, height:20, borderBottom:'3px solid #4CAF50', borderLeft:'3px solid #4CAF50', borderRadius:'0 0 0 4px' }}/>
                      <div style={{ position:'absolute', bottom:0, right:0, width:20, height:20, borderBottom:'3px solid #4CAF50', borderRight:'3px solid #4CAF50', borderRadius:'0 0 4px 0' }}/>
                    </div>
                  </div>
                )}

                {!cameraActive && (
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'white', gap:8 }}>
                    <Icon name="qr" size={40}/>
                    <span style={{ fontSize:13 }}>Kamera belum aktif</span>
                  </div>
                )}
              </div>

              {scanStatus && (
                <div style={{ padding:'8px 14px', background:COLORS.primaryLight, color:COLORS.primary, borderRadius:8, fontSize:13, marginBottom:12 }}>
                  📷 {scanStatus}
                </div>
              )}

              <div style={{ display:'flex', gap:8 }}>
                {!cameraActive ? (
                  <button onClick={startCamera} style={styles.btn('primary')}>
                    <Icon name="qr" size={14}/> Buka Kamera & Scan QR
                  </button>
                ) : (
                  <button onClick={stopCamera} style={styles.btn('danger')}>
                    ✕ Tutup Kamera
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab: PDF Upload */}
          {tab === 'pdf' && (
            <div>
              <div style={{ marginBottom:12, fontSize:13, color:'var(--color-text-secondary)' }}>
                Upload file PDF invoice yang didownload dari InvoiceSecure. Sistem akan membaca UUID dan memverifikasi otomatis.
              </div>

              <div
                onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
                onDragLeave={()=>setDragOver(false)}
                onDrop={handleFileDrop}
                style={{
                  border: `2px dashed ${dragOver ? COLORS.primary : 'var(--color-border-secondary)'}`,
                  borderRadius: 10, padding: 32, textAlign: 'center',
                  background: dragOver ? COLORS.primaryLight : 'var(--color-background-secondary)',
                  cursor: 'pointer', transition: 'all .2s', marginBottom: 12
                }}
                onClick={() => document.getElementById('pdfInput').click()}
              >
                <input id="pdfInput" type="file" accept=".pdf" style={{ display:'none' }} onChange={handleFileInput} />
                {pdfLoading ? (
                  <div style={{ color: COLORS.primary }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>
                    <div style={{ fontWeight:500 }}>Membaca PDF...</div>
                    <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Mencari UUID dan nomor invoice</div>
                  </div>
                ) : pdfFile ? (
                  <div style={{ color: COLORS.success }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
                    <div style={{ fontWeight:500 }}>{pdfFile.name}</div>
                    <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>Klik untuk ganti file</div>
                  </div>
                ) : (
                  <div style={{ color:'var(--color-text-secondary)' }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>⬆️</div>
                    <div style={{ fontWeight:500, marginBottom:4 }}>Drag & Drop file PDF di sini</div>
                    <div style={{ fontSize:12 }}>atau klik untuk pilih file</div>
                    <div style={{ fontSize:11, marginTop:8, color:COLORS.primary }}>Hanya file PDF dari InvoiceSecure yang didukung</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Error */}
      {err && (
        <div style={{ padding:'12px 16px', background:COLORS.dangerLight, color:COLORS.danger, borderRadius:8, marginBottom:16, fontSize:13 }}>
          ✗ {err}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ ...styles.card, border:`2px solid ${result.ok ? COLORS.success : COLORS.danger}` }}>

          {/* Status Banner */}
          <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', background: result.ok ? COLORS.successLight : COLORS.dangerLight, borderRadius:8, marginBottom:20 }}>
            <div style={{ fontSize:40 }}>{result.ok ? '✅' : '❌'}</div>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color: result.ok ? COLORS.success : COLORS.danger }}>
                {result.ok ? 'INVOICE VALID' : 'INVOICE TIDAK VALID'}
              </div>
              <div style={{ fontSize:13, color: result.ok ? COLORS.teal : COLORS.danger, marginTop:2 }}>
                {result.ok
                  ? 'Dokumen asli — tidak mengalami perubahan sejak diterbitkan'
                  : 'Dokumen terdeteksi telah dimodifikasi atau tanda tangan tidak sah'}
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

            {/* Invoice Detail */}
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
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:13 }}>
                  <span style={{ color:'var(--color-text-secondary)' }}>{k}</span>
                  <span style={{ fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Hash Detail */}
            <div>
              <h4 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600 }}>Detail Verifikasi Kriptografi</h4>

              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>Hash SHA-256 Tersimpan (Database):</div>
                <code style={{ fontSize:10, wordBreak:'break-all', color:COLORS.primary, display:'block', padding:'6px 8px', background:'var(--color-background-secondary)', borderRadius:4 }}>
                  {result.invoice.hash_sha256}
                </code>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:3 }}>Hash SHA-256 Dihitung Ulang (Saat Verifikasi):</div>
                <code style={{ fontSize:10, wordBreak:'break-all', color: result.hashMatch ? COLORS.success : COLORS.danger, display:'block', padding:'6px 8px', background:'var(--color-background-secondary)', borderRadius:4 }}>
                  {result.reHash || '(gagal dekripsi)'}
                </code>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['✓ Hash SHA-256 Cocok', result.hashMatch, 'Integritas data terjaga'],
                  ['✓ Tanda Tangan RSA Sah', result.rsaOk, 'Autentikasi pengirim valid'],
                ].map(([lbl, ok, desc]) => (
                  <div key={lbl} style={{ padding:'10px 12px', background: ok ? COLORS.successLight : COLORS.dangerLight, borderRadius:8 }}>
                    <div style={{ fontSize:12, fontWeight:600, color: ok ? COLORS.success : COLORS.danger }}>
                      {ok ? lbl : lbl.replace('✓','✗')}
                    </div>
                    <div style={{ fontSize:11, color: ok ? COLORS.teal : COLORS.danger, marginTop:2 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginTop:20 }}>
            <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:600 }}>Daftar Item Invoice</h4>
            <table style={styles.table}>
              <thead>
                <tr>{['No','Nama Item','Qty','Satuan','Harga Satuan','Total'].map(h=><th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {result.invoice.items.map((it,i)=>(
                  <tr key={i}>
                    <td style={styles.td}>{i+1}</td>
                    <td style={styles.td}><strong style={{fontWeight:500}}>{it.nama_item}</strong>{it.deskripsi&&<div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{it.deskripsi}</div>}</td>
                    <td style={styles.td}>{it.qty}</td>
                    <td style={styles.td}>{it.satuan||'unit'}</td>
                    <td style={styles.td}>{fmtShort(it.harga_satuan)}</td>
                    <td style={styles.td}>{fmtShort(it.qty*it.harga_satuan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Waktu verifikasi */}
          <div style={{ marginTop:12, fontSize:12, color:'var(--color-text-secondary)' }}>
            Waktu verifikasi: {new Date().toLocaleString('id-ID')} — UUID: {result.invoice.uuid_invoice}
          </div>
        </div>
      )}
    </div>
  );
}
