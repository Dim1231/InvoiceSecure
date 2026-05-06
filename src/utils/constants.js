// ── Color & Style Constants ─────────────────────────────────────────────────
export const COLORS = {
  primary: '#185FA5',
  primaryLight: '#E6F1FB',
  primaryDark: '#042C53',
  success: '#3B6D11',
  successLight: '#EAF3DE',
  danger: '#A32D2D',
  dangerLight: '#FCEBEB',
  warning: '#854F0B',
  warningLight: '#FAEEDA',
  gray: '#5F5E5A',
  grayLight: '#F1EFE8',
  grayMid: '#D3D1C7',
  purple: '#534AB7',
  purpleLight: '#EEEDFE',
  teal: '#0F6E56',
  tealLight: '#E1F5EE',
  coral: '#993C1D',
  coralLight: '#FAECE7',
};

const isMobile = () => window.innerWidth < 768;

export const styles = {
  page: { fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: 'var(--color-background-tertiary)', color: 'var(--color-text-primary)' },
  
  navbar: { background: COLORS.primaryDark, color: '#fff', padding: '0 12px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxSizing: 'border-box', overflowX: 'hidden' },
  navbarAdmin: { background: '#3C3489', color: '#fff', padding: '0 12px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxSizing: 'border-box', overflowX: 'hidden' },
  
  layout: { display: 'flex', minHeight: 'calc(100vh - 56px)' },
  
  sidebar: { 
    width: isMobile() ? 52 : 200, 
    minWidth: isMobile() ? 52 : 200,
    background: 'var(--color-background-primary)', 
    borderRight: '0.5px solid var(--color-border-tertiary)', 
    padding: '16px 0', 
    flexShrink: 0,
    transition: 'width .2s',
  },
  
  main: { flex: 1, padding: isMobile() ? 12 : 24, overflow: 'auto', minWidth: 0 },
  card: { background: 'var(--color-background-primary)', borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', padding: isMobile() ? '12px 14px' : '16px 20px', marginBottom: 16 },
  statCard: { background: 'var(--color-background-secondary)', borderRadius: 8, padding: isMobile() ? 10 : 16, textAlign: 'center' },
  
  btn: (variant='primary') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
    border: variant==='outline' ? '0.5px solid var(--color-border-secondary)' : 'none',
    background: variant==='primary' ? COLORS.primary : variant==='success' ? COLORS.success : variant==='danger' ? COLORS.danger : variant==='outline' ? 'transparent' : COLORS.grayLight,
    color: variant==='outline' ? 'var(--color-text-primary)' : variant==='ghost' ? 'var(--color-text-secondary)' : '#fff',
    cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'opacity .15s',
  }),
  
  input: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: isMobile() ? 16 : 14, boxSizing: 'border-box' },
  label: { fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 500 },
  
  badge: (type) => {
    const map = {valid:{bg:COLORS.successLight,color:COLORS.success},invalid:{bg:COLORS.dangerLight,color:COLORS.danger},draft:{bg:COLORS.grayLight,color:COLORS.gray},user:{bg:COLORS.primaryLight,color:COLORS.primary},admin:{bg:COLORS.purpleLight,color:COLORS.purple}};
    const s = map[type]||map.draft;
    return { background:s.bg, color:s.color, padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:500, display:'inline-block' };
  },
  
  table: { width: '100%', borderCollapse: 'collapse', fontSize: isMobile() ? 11 : 13 },
  th: { textAlign: 'left', padding: isMobile() ? '8px 6px' : '10px 12px', borderBottom: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 },
  td: { padding: isMobile() ? '8px 6px' : '10px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)' },
  
  sidebarLink: (active) => ({ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: isMobile() ? 'center' : 'flex-start',
    gap: 10, 
    padding: isMobile() ? '12px 0' : '10px 16px', 
    cursor: 'pointer', 
    background: active ? COLORS.primaryLight : 'transparent', 
    color: active ? COLORS.primary : 'var(--color-text-secondary)', 
    fontSize: 14, 
    fontWeight: active ? 500 : 400, 
    borderLeft: active ? `3px solid ${COLORS.primary}` : '3px solid transparent', 
    transition: 'all .15s',
    overflow: 'hidden',
  }),
};

// ── Format helpers ──────────────────────────────────────────────────────────
export const fmt = (n) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export const fmtShort = (n) => `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`;