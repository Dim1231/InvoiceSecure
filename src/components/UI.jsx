import { useEffect, useState } from "react";
import { COLORS, styles } from '../utils/constants';

// ── Icon Component ──────────────────────────────────────────────────────────
export function Icon({ name, size=16 }) {
  const icons = {
    home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
    check: 'M20 6L9 17l-5-5',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
    settings: 'M12 20h9 M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
    logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
    plus: 'M12 5v14M5 12h14',
    download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.35-4.35',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    qr: 'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h2v2h-2z M19 15h2v2h-2z M15 19h2v2h-2z M19 19h2v2h-2z M11 3v2H9V3z M9 9v2H7V9z M11 9h2v2h-2z M13 7V5h2v2z M7 11h2v4H7z M11 13h2v2h-2z M13 13h4v2h-4z M13 17h2v2h-2z M11 17h2v4h-2z',
    lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6z',
    trash: 'M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2',
    alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
    users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75 M9 11a4 4 0 100-8 4 4 0 000 8z',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {(icons[name]||icons.file).split(' M').map((d,i) => <path key={i} d={(i===0?'':' M')+d}/>)}
    </svg>
  );
}

// ── Modal Component ─────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width=560 }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--color-background-primary)',borderRadius:12,width,maxWidth:'100%',maxHeight:'90vh',overflow:'auto',boxSizing:'border-box' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
          <h3 style={{ margin:0,fontSize:16,fontWeight:500 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--color-text-secondary)',lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'16px 20px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Toast Component ─────────────────────────────────────────────────────────
export function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return ()=>clearTimeout(t); }, []);
  const bg = type==='success' ? COLORS.successLight : type==='error' ? COLORS.dangerLight : COLORS.primaryLight;
  const color = type==='success' ? COLORS.success : type==='error' ? COLORS.danger : COLORS.primary;
  return (
    <div style={{ position:'fixed',bottom:24,right:24,background:bg,color,padding:'12px 20px',borderRadius:10,fontWeight:500,fontSize:14,zIndex:9999,boxShadow:'0 4px 16px rgba(0,0,0,.12)',maxWidth:320 }}>
      {msg}
    </div>
  );
}

// ── Sidebar Component ───────────────────────────────────────────────────────
export function Sidebar({ page, setPage, user }) {
  const userLinks = [
    { id:'dashboard',icon:'home',label:'Dashboard' },
    { id:'buat',icon:'plus',label:'Buat Invoice' },
    { id:'riwayat',icon:'list',label:'Riwayat Invoice' },
    { id:'verifikasi',icon:'check',label:'Verifikasi' },
    { id:'pengaturan',icon:'settings',label:'Pengaturan' },
  ];
  const adminLinks = [
    { id:'dashboard',icon:'home',label:'Dashboard' },
    { id:'buat',icon:'plus',label:'Buat Invoice' },
    { id:'riwayat',icon:'list',label:'Semua Invoice' },
    { id:'pengguna',icon:'users',label:'Pengguna' },
    { id:'verifikasi',icon:'check',label:'Verifikasi' },
    { id:'log',icon:'activity',label:'Log Sistem' },
    { id:'pengaturan',icon:'settings',label:'Pengaturan' },
  ];
  const links = user.role==='admin' ? adminLinks : userLinks;
  return (
    <div style={styles.sidebar}>
      {links.map(l => (
        <div key={l.id} onClick={()=>setPage(l.id)} style={styles.sidebarLink(page===l.id)}>
          <Icon name={l.icon} size={16}/> {l.label}
        </div>
      ))}
    </div>
  );
}
