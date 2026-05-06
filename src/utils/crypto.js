// ── Crypto Utilities ──────────────────────────────────────────────────────────

// SHA-256 pure JS implementation
export function sha256(message) {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const bytes = [];
  for (let i = 0; i < message.length; i++) {
    const c = message.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) { bytes.push(192|(c>>6)); bytes.push(128|(c&63)); }
    else { bytes.push(224|(c>>12)); bytes.push(128|((c>>6)&63)); bytes.push(128|(c&63)); }
  }
  const len = bytes.length;
  bytes.push(0x80);
  while ((bytes.length%64)!==56) bytes.push(0);
  const bitLen = len*8;
  bytes.push(0,0,0,0,(bitLen>>>24)&0xff,(bitLen>>>16)&0xff,(bitLen>>>8)&0xff,bitLen&0xff);
  for (let i = 0; i < bytes.length; i+=64) {
    const W = [];
    for (let j = 0; j < 16; j++) W[j]=(bytes[i+j*4]<<24)|(bytes[i+j*4+1]<<16)|(bytes[i+j*4+2]<<8)|bytes[i+j*4+3];
    for (let j = 16; j < 64; j++) {
      const s0=rotr(W[j-15],7)^rotr(W[j-15],18)^(W[j-15]>>>3);
      const s1=rotr(W[j-2],17)^rotr(W[j-2],19)^(W[j-2]>>>10);
      W[j]=(W[j-16]+s0+W[j-7]+s1)|0;
    }
    let [a,b,c,d,e,f,g,h]=H;
    for (let j = 0; j < 64; j++) {
      const S1=rotr(e,6)^rotr(e,11)^rotr(e,25);
      const ch=(e&f)^(~e&g);
      const temp1=(h+S1+ch+K[j]+W[j])|0;
      const S0=rotr(a,2)^rotr(a,13)^rotr(a,22);
      const maj=(a&b)^(a&c)^(b&c);
      const temp2=(S0+maj)|0;
      h=g;g=f;f=e;e=(d+temp1)|0;d=c;c=b;b=a;a=(temp1+temp2)|0;
    }
    H=[H[0]+a,H[1]+b,H[2]+c,H[3]+d,H[4]+e,H[5]+f,H[6]+g,H[7]+h].map(v=>v|0);
  }
  return H.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
function rotr(n,x){ return (n>>>x)|(n<<(32-x)); }

// Simulated AES-256-CBC (XOR-based untuk demo)
export function simAES256Encrypt(text, key) {
  const k = sha256(key).slice(0,32);
  const iv = Math.random().toString(36).slice(2,18).padEnd(16,'0');
  let enc = '';
  for (let i = 0; i < text.length; i++) {
    enc += String.fromCharCode(text.charCodeAt(i)^k.charCodeAt(i%k.length)^iv.charCodeAt(i%iv.length));
  }
  return btoa(iv+':'+enc);
}
export function simAES256Decrypt(cipherB64, key) {
  try {
    const k = sha256(key).slice(0,32);
    const raw = atob(cipherB64);
    const sep = raw.indexOf(':');
    const iv = raw.slice(0,sep);
    const enc = raw.slice(sep+1);
    let dec = '';
    for (let i = 0; i < enc.length; i++) {
      dec += String.fromCharCode(enc.charCodeAt(i)^k.charCodeAt(i%k.length)^iv.charCodeAt(i%iv.length));
    }
    return dec;
  } catch { return null; }
}

// RSA simulation (bilangan kecil untuk demo — sesuai proposal skripsi)
function modPow(base, exp, mod) {
  let result = BigInt(1);
  base = BigInt(base)%BigInt(mod);
  exp = BigInt(exp);
  mod = BigInt(mod);
  while (exp > 0n) {
    if (exp%2n===1n) result=(result*base)%mod;
    exp=exp/2n;
    base=(base*base)%mod;
  }
  return result;
}
export const RSA_PARAMS = { p:61, q:53, n:3233, e:17, d:2753 };
export function rsaSign(hashHex) {
  const m = parseInt(hashHex.slice(0,6),16)%RSA_PARAMS.n;
  const s = Number(modPow(m, RSA_PARAMS.d, RSA_PARAMS.n));
  return s.toString(16).padStart(4,'0');
}
export function rsaVerify(hashHex, sigHex) {
  const m = parseInt(hashHex.slice(0,6),16)%RSA_PARAMS.n;
  const s = parseInt(sigHex,16);
  const recovered = Number(modPow(s, RSA_PARAMS.e, RSA_PARAMS.n));
  return recovered===m;
}

// UUID v4
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
    const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

// QR Code - generate real scannable QR menggunakan library qrcode
export async function generateQRDataURL(text, size=200) {
  try {
    const QRCode = await import('qrcode');
    return await QRCode.default.toDataURL(text, {
      errorCorrectionLevel: 'M',
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });
  } catch(e) {
    console.error('QR Error:', e);
    return '';
  }
}

// Extract UUID from PDF binary (works for jsPDF-generated PDFs)
export async function extractUUIDFromPDF(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bytes = new Uint8Array(e.target.result);
        // Decode as latin1 to preserve binary
        let text = '';
        for (let i = 0; i < bytes.length; i++) {
          text += String.fromCharCode(bytes[i]);
        }
        // UUID v4 pattern
        const uuidMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
        // Invoice number pattern
        const invMatch = text.match(/INV-\d{4}-\d+/);
        resolve({ uuid: uuidMatch?.[0] || null, nomor: invMatch?.[0] || null });
      } catch {
        resolve({ uuid: null, nomor: null });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// Generate PDF invoice menggunakan jsPDF
export async function generateInvoicePDF(invoice, ownerName) {
  const { jsPDF } = await import('jspdf');
  const QRCode = await import('qrcode');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;

  // Header background
  doc.setFillColor(4, 44, 83);
  doc.rect(0, 0, W, 42, 'F');

  // Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', W/2, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('InvoiceSecure — Sistem Invoice Terenkripsi Digital', W/2, 27, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Dilindungi AES-256 + SHA-256 + RSA Digital Signature', W/2, 34, { align: 'center' });

  // Invoice info box
  doc.setTextColor(0,0,0);
  doc.setFillColor(240, 245, 251);
  doc.rect(15, 48, 85, 30, 'F');
  doc.rect(110, 48, 85, 30, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DARI:', 20, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(ownerName || 'PT InvoiceSecure', 20, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('KEPADA:', 115, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.nama_penerima, 115, 62);
  if (invoice.email_penerima) doc.text(invoice.email_penerima, 115, 68);

  // Invoice details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`No. Invoice: ${invoice.nomor_invoice}`, 15, 90);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Tanggal: ${invoice.tanggal_invoice}`, 15, 97);
  doc.text(`Status: ${invoice.status_validasi.toUpperCase()}`, 140, 97);

  // Items table header
  let y = 108;
  doc.setFillColor(24, 95, 165);
  doc.rect(15, y, 180, 9, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('No', 18, y+6);
  doc.text('Nama Item', 30, y+6);
  doc.text('Qty', 120, y+6);
  doc.text('Harga Satuan', 133, y+6);
  doc.text('Total', 173, y+6);

  // Items rows
  doc.setTextColor(0,0,0);
  doc.setFont('helvetica', 'normal');
  invoice.items.forEach((item, i) => {
    y += 9;
    if (i%2===0) { doc.setFillColor(248,250,252); doc.rect(15,y,180,9,'F'); }
    doc.text(String(i+1), 18, y+6);
    const nm = item.nama_item.length > 38 ? item.nama_item.slice(0,35)+'...' : item.nama_item;
    doc.text(nm, 30, y+6);
    doc.text(String(item.qty), 122, y+6);
    doc.text(`Rp ${item.harga_satuan.toLocaleString('id-ID')}`, 133, y+6);
    doc.text(`Rp ${(item.qty*item.harga_satuan).toLocaleString('id-ID')}`, 173, y+6);
  });

  // Totals
  y += 14;
  doc.setDrawColor(200,210,220);
  doc.line(110, y, 195, y);
  y += 5;
  const totals = [['Subtotal', invoice.subtotal], ['Diskon', invoice.diskon], ['PPN', invoice.ppn]];
  totals.forEach(([lbl, val]) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(lbl+':', 130, y);
    const display = lbl==='Diskon' ? `-Rp ${val.toLocaleString('id-ID')}` : `Rp ${val.toLocaleString('id-ID')}`;
    doc.text(display, 193, y, { align:'right' });
    y += 6;
  });
  doc.line(110, y, 195, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL BAYAR:', 130, y);
  doc.text(`Rp ${invoice.total_bayar.toLocaleString('id-ID')}`, 193, y, { align:'right' });

  // Catatan
  if (invoice.catatan) {
    y += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Catatan:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.catatan, 15, y+6);
    y += 6;
  }

  // Security info box
  y += 16;
  doc.setFillColor(230, 241, 251);
  doc.rect(15, y, 125, 28, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4,44,83);
  doc.text('INFORMASI KEAMANAN DOKUMEN', 18, y+6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60,60,80);
  doc.text(`UUID    : ${invoice.uuid_invoice}`, 18, y+12);
  doc.text(`SHA-256 : ${invoice.hash_sha256.slice(0,40)}...`, 18, y+18);
  doc.text(`RSA Sig : ${invoice.rsa_signature}  (n=3233, e=17, d=2753)`, 18, y+24);

  // QR Code
  try {
    const qrDataUrl = await QRCode.default.toDataURL(invoice.qr_code_url, { width:120, errorCorrectionLevel:'M', margin:1 });
    doc.addImage(qrDataUrl, 'PNG', 148, y, 42, 42);
    doc.setFontSize(7);
    doc.setTextColor(80,80,80);
    doc.text('Scan QR untuk verifikasi', 169, y+45, { align:'center' });
  } catch(e) { console.warn('QR failed:', e); }

  // Footer
  doc.setFillColor(4,44,83);
  doc.rect(0, 278, W, 19, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(8);
  doc.text('Invoice ini dilindungi tanda tangan digital RSA & hash SHA-256. Scan QR untuk verifikasi keaslian.', W/2, 285, { align:'center' });
  doc.setFontSize(7);
  doc.text(invoice.qr_code_url, W/2, 291, { align:'center' });

  doc.save(`${invoice.nomor_invoice}.pdf`);
}
