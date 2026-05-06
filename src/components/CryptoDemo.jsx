import { useState } from "react";
import { sha256, rsaSign, rsaVerify } from '../utils/crypto';
import { COLORS, styles } from '../utils/constants';

// ── Crypto Demo ───────────────────────────────────────────────────────────────
export default function CryptoDemo() {
  const [demoText, setDemoText] = useState('INV-2026-024|PT Maju Bersama|5400000|2026-03-14');
  const hash = sha256(demoText);
  const sig = rsaSign(hash);
  const verified = rsaVerify(hash, sig);

  return (
    <div style={{ marginTop:16 }}>
      <div style={styles.card}>
        <h3 style={{ margin:'0 0 12px',fontSize:14,fontWeight:500 }}>Demo Kriptografi Langsung</h3>
        <label style={styles.label}>Input Data Invoice</label>
        <textarea style={{ ...styles.input,height:60,resize:'none',marginBottom:12 }} value={demoText} onChange={e=>setDemoText(e.target.value)} />
        <div style={{ display:'grid',gridTemplateColumns:'1fr',gap:8 }}>
          {[['SHA-256 Hash',hash,'Fungsi hash deterministik, 256-bit output'],['RSA Signature (demo)',sig,`m=${parseInt(hash.slice(0,6),16)%3233}, S=m^d mod n = m^2753 mod 3233`],['Verifikasi RSA',verified?'✓ VALID - H\'(M) = H(M)':'✗ TIDAK VALID',`S^e mod n = ${parseInt(sig,16)}^17 mod 3233 = ${parseInt(hash.slice(0,6),16)%3233}`]].map(([title,val,desc])=>(
            <div key={title} style={{ padding:12,background:'var(--color-background-secondary)',borderRadius:8 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
                <span style={{ fontSize:12,fontWeight:500,color:COLORS.primary }}>{title}</span>
                {title.includes('Verifikasi') && <span style={{ fontSize:12,fontWeight:700,color:verified?COLORS.success:COLORS.danger }}>{val}</span>}
              </div>
              {!title.includes('Verifikasi') && <code style={{ fontSize:11,wordBreak:'break-all',color:'var(--color-text-secondary)',display:'block',marginBottom:4 }}>{val}</code>}
              <div style={{ fontSize:11,color:'var(--color-text-secondary)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
