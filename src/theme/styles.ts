import React from "react";

// --- 1. PALETA DE COLORES ---
const palette = {
  navy: "#003366",       // Azul Corporativo
  activeNavy: "#004080", // Azul Activo
  background: "#F4F7F9", // Fondo Gris Claro
  orange: "#FF6600",     // Naranja Seguridad
  white: "#FFFFFF",
  slateDark: "#1E293B",  // Texto Principal (Oscuro)
  slateLight: "#64748B", // Texto Secundario
  border: "#CBD5E1",     // Bordes
  success: "#10B981",    
  error: "#EF4444",      
  warning: "#F59E0B",    
  consoleBg: "#1E293B",
  consoleText: "#38BDF8"
};

// --- 2. MIXINS (Estilos Base) ---
const actionBtnBase: React.CSSProperties = {
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "48px", padding: "0 16px", borderRadius: "4px",
    fontSize: "13px", fontWeight: "700", textTransform: "uppercase",
    cursor: "pointer", fontFamily: "inherit", boxSizing: "border-box",
    width: "100%", marginTop: 0, marginBottom: 0, lineHeight: "1",
    transition: "background 0.2s, opacity 0.2s"
};

// [CORRECCIÓN AQUÍ] - Forzamos colores explícitos
const baseInput: React.CSSProperties = {
    width: "100%", padding: "12px", fontSize: "14px",
    border: `1px solid ${palette.border}`, borderRadius: "4px",
    boxSizing: "border-box", fontFamily: "inherit", outline: "none",
    transition: "border-color 0.2s",
    
    // Agregados para evitar texto blanco fantasma:
    color: palette.slateDark,       // Texto siempre oscuro (#1E293B)
    backgroundColor: palette.white, // Fondo siempre blanco (#FFFFFF)
};

// =============================================================================
// BLOQUE A: ESTILOS GLOBALES
// =============================================================================
export const styles: Record<string, React.CSSProperties> = {
  // --- LAYOUT ---
  page: { minHeight: "100vh", backgroundColor: palette.background, fontFamily: "'Inter', sans-serif", color: palette.slateDark, display: "flex", flexDirection: "column", overflow: "hidden" },
  container: { maxWidth: "900px", width: "100%", margin: "0 auto", padding: "20px 20px 90px 20px", flex: 1, boxSizing: "border-box", overflowY: "auto", height: "100vh" },
  scrollableY: { overflowY: "auto", flex: 1, minHeight: "0", maxHeight: "65vh", paddingRight: "6px", scrollbarWidth: "thin", paddingBottom: "100px" },

  // --- COMPONENTES BASE ---
  card: { backgroundColor: palette.white, border: `1px solid ${palette.border}`, borderRadius: "6px", padding: "24px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "20px", display: "flex", flexDirection: "column", maxHeight: "85vh" },

  // --- NAV ---
  navbar: { backgroundColor: palette.navy, color: palette.white, height: "50px", padding: "0 20px", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, boxShadow: "0 2px 4px rgba(0,0,0,0.1)", zIndex: 1000, position: 'relative' },
  navbarBrand: { fontSize: "14px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" },
  
  statusBar: { backgroundColor: "#F8FAFC", padding: "4px 20px", borderBottom: `1px solid ${palette.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: palette.slateLight, flexShrink: 0, height: "36px" },

  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, height: "64px", backgroundColor: palette.white, borderTop: `1px solid ${palette.border}`, display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 2000, boxShadow: "0 -4px 20px rgba(0,0,0,0.03)", paddingBottom: "env(safe-area-inset-bottom)" },
  bottomNavItem: { flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: palette.slateLight, transition: "color 0.2s", padding: "8px 0" },
  bottomNavItemActive: { color: palette.navy, fontWeight: "700" },
  navLabel: { fontSize: "10px", marginTop: "4px", textTransform: "uppercase", fontWeight: "inherit", letterSpacing: "0.5px" },

  // --- INPUTS & TYPO ---
  heading: { fontSize: "15px", fontWeight: "700", color: palette.navy, textTransform: "uppercase", marginBottom: "16px", paddingBottom: "8px", borderBottom: `2px solid ${palette.background}`, flexShrink: 0 },
  label: { display: "block", fontSize: "11px", fontWeight: "700", color: palette.slateLight, textTransform: "uppercase", marginBottom: "6px" },
  
  // Usamos el baseInput corregido
  input: { ...baseInput, marginBottom: "16px" },
  selects: {...baseInput, width: '100%', height: '45px', paddingTop: '0px', paddingBottom: '0px'},

  text: { fontSize: "14px", color: palette.slateDark, lineHeight: "1.5" },
  monoText: { fontFamily: "'Roboto Mono', monospace", fontSize: "12px", color: palette.slateDark, backgroundColor: "#F1F5F9", padding: "4px 8px", borderRadius: "4px", display: "inline-block", border: "1px solid #E2E8F0" },

  // --- BOTONES ---
  btnPrimary: { ...actionBtnBase, backgroundColor: palette.orange, color: palette.white, border: "none", marginTop: "10px", boxShadow: "0 2px 4px rgba(255, 102, 0, 0.2)" },
  btnSecondary: { ...actionBtnBase, backgroundColor: palette.white, border: `1px solid ${palette.slateLight}`, color: palette.slateDark },
  btnDanger: { ...actionBtnBase, backgroundColor: "#FEF2F2", border: "1px solid #EF4444", color: "#DC2626" },
  btnLink: { background: "none", border: "none", color: palette.navy, textDecoration: "underline", cursor: "pointer", fontSize: "13px", fontWeight: "600", fontFamily: "inherit", padding: "8px" },

  // --- UTILS ---
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" },
  gridItem: { padding: "20px", backgroundColor: palette.white, border: `1px solid ${palette.border}`, borderRadius: "4px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s" },
  flexBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 },
  breadcrumbs: { padding: "12px 20px", fontSize: "12px", color: palette.slateLight, display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", flexShrink: 0 },
  breadcrumbItem: { fontWeight: "700", color: palette.navy },

  // --- MODALES ---
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, backdropFilter: "blur(2px)" },
  modalCard: { backgroundColor: palette.white, width: "90%", maxWidth: "400px", padding: "24px", borderRadius: "6px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
  detailOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#F4F7F9", zIndex: 3000, display: "flex", flexDirection: "column", overflow: "hidden" },
  detailHeader: { padding: "16px 20px", backgroundColor: "#FFFFFF", borderBottom: "1px solid #CBD5E1", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", zIndex: 10 },
  detailContent: { flex: 1, overflowY: "auto", padding: "20px 20px 100px 20px", maxWidth: "800px", width: "100%", margin: "0 auto", boxSizing: "border-box" },
  backArrowBtn: { background: "transparent", border: "1px solid #CBD5E1", borderRadius: "4px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#334155", cursor: "pointer", transition: "background 0.2s" }
};

// =============================================================================
// BLOQUE B: ESTILOS ESPECÍFICOS PARA EVIDENCIA
// =============================================================================
export const evidenceStyles: Record<string, React.CSSProperties> = {
  // 1. Cabecera
  headerClean: { fontSize: "15px", fontWeight: "700", color: palette.navy, textTransform: "uppercase", margin: 0, padding: 0, border: 'none' },
  
  // 2. Badge
  badgeBase: { display: "inline-block", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" },
  badgeOnline: { backgroundColor: '#D1FAE5', color: '#065F46' },
  badgeOffline: { backgroundColor: '#F1F5F9', color: '#64748B' },

  // 3. Toggles
  toggleContainer: { display: 'flex', width: '100%', backgroundColor: '#F1F5F9', borderRadius: '6px', padding: '4px', marginBottom: '16px', boxSizing: 'border-box' },
  toggleBtn: { flex: 1, padding: '6px', borderRadius: '4px', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'transparent', color: '#94A3B8' },
  toggleBtnActive: { backgroundColor: palette.white, color: palette.navy, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },

  // 4. Mapa
  mapContainer: { width: '100%', height: '160px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${palette.border}`, backgroundColor: '#E2E8F0', marginBottom: '16px', position: 'relative' },
  mapIframe: { width: '100%', height: '100%', border: 0, pointerEvents: 'none', display: 'block' },
  mapPlaceholder: { display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', color:'#94A3B8' },

  // 5. Grillas e Inputs
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' },
  utmRow: { display: 'flex', gap: '8px', alignItems: 'flex-end', width: '100%' },
  
  // Input de solo lectura
  inputReadOnly: { ...baseInput, marginBottom: 0, backgroundColor: '#F8FAFC', color: palette.slateDark, fontFamily: 'monospace' },
  
  // Inputs de UTM (Heredan color oscuro de baseInput)
  inputCenter: { ...baseInput, marginBottom: 0, textAlign: 'center' },
  inputNoMargin: { ...baseInput, marginBottom: 0 },
  
  // 6. Botones Específicos
  btnSquare: { ...actionBtnBase, backgroundColor: palette.orange, color: palette.white, border: "none", width: '42px', height: '42px', padding: 0, marginTop: 0, flexShrink: 0 },
  btnSmall: { ...actionBtnBase, backgroundColor: palette.white, border: `1px solid ${palette.slateLight}`, color: palette.slateDark, fontSize: '11px', gap: '6px', height: '32px' },

  // 7. Carga
  uploadRow: { display: 'flex', gap: '12px', height: '120px', marginBottom: '16px', width: '100%' },
  uploadBtnLarge: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${palette.border}`, borderRadius: '8px', backgroundColor: '#F8FAFC', cursor: 'pointer', color: palette.slateLight, transition: 'background 0.2s', padding: '10px' },
  uploadBtnLargeActive: { color: palette.navy, borderColor: palette.navy, backgroundColor: "#F0F9FF" },

  previewContainer: { borderRadius: '6px', border: `1px solid ${palette.border}`, overflow: 'hidden', height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', marginBottom: '16px' },
  actionsRow: { display: 'flex', gap: '10px', marginTop: '12px' },

  // 8. Consola
  console: { backgroundColor: palette.consoleBg, color: palette.consoleText, padding: '12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', marginBottom: '16px', borderLeft: `4px solid ${palette.success}` }
};
