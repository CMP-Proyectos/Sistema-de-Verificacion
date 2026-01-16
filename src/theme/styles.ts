import React from "react";

export const styles: Record<string, React.CSSProperties> = {
  // --- LAYOUT GENERAL (Fondo más "hormigón" suave) ---
  page: { 
    minHeight: "100vh", 
    backgroundColor: "#F1F5F9", // Gris pizarra muy claro (Slate-100)
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#0F172A" // Texto base oscuro
  },
  
  // --- NAVBAR "INDUSTRIAL DARK" ---
  navbar: {
    backgroundColor: "#1E293B", // Azul Pizarra Oscuro (Slate-800)
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#FFFFFF", // Texto blanco puro
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    position: "sticky",
    top: 0,
    zIndex: 1000
  },
  navbarBrand: {
    fontSize: "18px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    color: "#F8FAFC" // Blanco humo
  },
  hamburgerBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "6px",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 10px",
    transition: "background 0.2s"
  },
  
  // --- MENÚ DESPLEGABLE ---
  dropdownMenu: {
    backgroundColor: "#1E293B", // Mismo fondo que navbar
    borderTop: "1px solid #334155",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    position: "absolute",
    top: "60px", 
    left: 0,
    right: 0,
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
    padding: "8px 0"
  },
  menuItem: {
    padding: "12px 24px",
    borderBottom: "1px solid #334155", // Separadores sutiles
    color: "#E2E8F0", // Texto claro
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    textAlign: "left",
    background: "none",
    border: "none",
    width: "100%"
  },

  // --- BARRA DE ESTADO Y NAVEGACIÓN ---
  statusBar: {
    backgroundColor: "#FFFFFF",
    padding: "8px 24px",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
    letterSpacing: "0.5px"
  },
  navControls: {
    padding: "16px 24px 0",
    display: "flex",
    gap: "12px"
  },
  // Botón "Inicio" (Sobrio)
  navButtonPrimary: {
    padding: "10px 16px",
    borderRadius: "6px",
    backgroundColor: "#334155", // Gris Acero (Slate-700)
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    flex: 1,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  },
  // Botón "Atrás" (Borde oscuro)
  navButton: {
    padding: "10px 16px",
    borderRadius: "6px",
    border: "1px solid #CBD5F5",
    backgroundColor: "#FFFFFF",
    color: "#334155", // Texto oscuro
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    flex: 1, 
    textAlign: "center"
  },

  // --- COMPONENTES UI ---
  breadcrumbs: { 
    display: "flex", 
    flexWrap: "wrap", 
    alignItems: "center", 
    gap: "6px", 
    padding: "12px 24px", 
    fontSize: "12px",
    color: "#475569" 
  },
  breadcrumbItem: { color: "#1E293B", fontWeight: 700 }, // Slate oscuro
  breadcrumbSeparator: { color: "#94A3B8", fontSize: "14px" }, // Slate claro
  
  card: { 
    backgroundColor: "#FFFFFF", 
    margin: "0 24px 24px", 
    padding: "24px", 
    borderRadius: "8px", // Bordes menos redondeados (más industrial)
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    border: "1px solid #E2E8F0"
  },
  sectionTitle: { 
    fontSize: "16px", 
    fontWeight: 700, 
    color: "#1E293B", // Slate oscuro
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  
  // --- FORMULARIOS ---
  label: { fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px", display: "block", textTransform: "uppercase" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #CBD5F5", borderRadius: "6px", padding: "12px", fontSize: "14px", color: "#0F172A", marginBottom: "16px", backgroundColor: "#FFFFFF" },
  inputCompact: { border: "1px solid #CBD5F5", borderRadius: "6px", padding: "8px", fontSize: "13px", backgroundColor: "#FFFFFF", color: "#0F172A" },
  textArea: { width: "100%", boxSizing: "border-box", minHeight: "100px", border: "1px solid #CBD5F5", borderRadius: "6px", padding: "12px", fontSize: "14px", color: "#0F172A", backgroundColor: "#FFFFFF", marginBottom: "16px", fontFamily: "inherit" },
  
  // --- BOTONES DE ACCIÓN ---
  // Acción Principal (Guardar - Mantiene Azul sólido)
  primaryButton: { 
    width: "100%", boxSizing: "border-box", 
    backgroundColor: "#0B5FFF", // Azul Industrial brillante
    color: "#FFFFFF", 
    border: "none", borderRadius: "6px", 
    padding: "14px", fontSize: "15px", fontWeight: 700, 
    cursor: "pointer", marginTop: "12px",
    boxShadow: "0 4px 6px -1px rgba(11, 95, 255, 0.2)"
  },
  primaryButtonDisabled: { width: "100%", boxSizing: "border-box", backgroundColor: "#94A3B8", color: "#F1F5F9", border: "none", borderRadius: "6px", padding: "14px", fontSize: "15px", fontWeight: 700, cursor: "not-allowed", marginTop: "12px" },
  
  // Secundarios (Gris/Pizarra)
  secondaryButton: { 
    width: "100%", boxSizing: "border-box", marginTop: "12px", 
    border: "1px solid #475569", // Borde gris pizarra
    borderRadius: "6px", padding: "12px", 
    backgroundColor: "transparent", 
    color: "#475569", // Texto gris pizarra
    fontSize: "14px", fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s"
  },
  secondaryButtonSmall: { 
    border: "1px solid #475569", borderRadius: "6px", padding: "6px 12px", 
    backgroundColor: "transparent", color: "#475569", 
    fontSize: "12px", fontWeight: 600, cursor: "pointer" 
  },
  dangerButton: { width: "100%", boxSizing: "border-box", marginTop: "12px", border: "1px solid #EF4444", borderRadius: "6px", padding: "12px", backgroundColor: "#FEF2F2", color: "#B91C1C", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  
  // --- GRID & OPCIONES ---
  optionGrid: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" },
  optionButton: { 
    border: "1px solid #CBD5F5", borderRadius: "6px", padding: "12px 16px", 
    backgroundColor: "#FFFFFF", 
    fontSize: "13px", fontWeight: 600, color: "#334155", 
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)" 
  },
  
  mapPlaceholder: { borderRadius: "8px", overflow: "hidden", border: "1px solid #CBD5F5", backgroundColor: "#E2E8F0" },
  mapFrame: { width: "100%", border: "0" },
  emptyState: { padding: "30px", fontSize: "14px", color: "#64748B", textAlign: "center", fontStyle: "italic" },
  
  detailInfoBox: { borderRadius: "6px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", marginBottom: "16px" },
  
  evidenceBox: { 
    border: "2px dashed #CBD5F5", // Borde discontinuo más técnico
    borderRadius: "8px", padding: "10px", 
    display: "flex", alignItems: "center", justifyContent: "center", 
    backgroundColor: "#F8FAFC", marginBottom: "16px", 
    flexDirection: "column", minHeight: "200px"
  },
  evidenceImage: { width: "100%", height: "auto", objectFit: "contain", borderRadius: "4px" },
  
  searchInput: { width: "100%", boxSizing: "border-box", border: "1px solid #CBD5F5", borderRadius: "6px", padding: "12px", fontSize: "14px", color: "#0F172A", backgroundColor: "#FFFFFF", marginBottom: "10px" },
  searchResults: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px", backgroundColor: "#F8FAFC" },
  searchOption: { border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px", backgroundColor: "#FFFFFF", textAlign: "left", cursor: "pointer" },
  searchOptionTitle: { display: "block", fontSize: "13px", fontWeight: 700, color: "#1E293B" },
  searchOptionMeta: { display: "block", fontSize: "11px", color: "#64748B", marginTop: "4px", textTransform: "uppercase" },

  readOnlyBlock: { display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "16px", padding: "16px", borderRadius: "8px", backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0" },
  profileMessage: { marginTop: "8px", padding: "10px 12px", borderRadius: "6px", backgroundColor: "#EFF6FF", fontSize: "13px", color: "#1E293B", borderLeft: "4px solid #3B82F6" },
  
  authFooter: { marginTop: "24px", textAlign: "center", fontSize: "13px", color: "#64748B" },
  linkText: { color: "#0F172A", fontWeight: 700, cursor: "pointer", textDecoration: "underline" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px", backdropFilter: "blur(2px)" },
  modalCard: { backgroundColor: "#FFFFFF", width: "100%", maxWidth: "420px", borderRadius: "8px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column" },
  modalButtons: { display: "flex", gap: "12px", marginTop: "24px", width: "100%" },

  gridContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px", padding: "10px 0", marginBottom: "20px" },
  cardItem: { backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", transition: "transform 0.1s ease", height: "100%" },
  cardImagePlaceholder: { width: "100%", height: "120px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "24px" },
  cardImage: { width: "100%", height: "120px", objectFit: "cover", borderBottom: "1px solid #E2E8F0" },
  cardFooter: { padding: "10px", display: "flex", flexDirection: "column", gap: "4px", flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  cardTitle: { fontSize: "11px", fontWeight: "700", color: "#1E293B", lineHeight: "1.3", textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  
  detailOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF", zIndex: 2000, display: "flex", flexDirection: "column", overflowY: "auto" },
  detailHeader: { padding: "16px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", backgroundColor: "#FFFFFF", position: "sticky", top: 0, zIndex: 10, gap: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  backArrowBtn: { background: "none", border: "none", fontSize: "24px", color: "#334155", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" },
  detailContent: { padding: "24px", maxWidth: "640px", margin: "0 auto", width: "100%", boxSizing: "border-box", flex: 1 },
  detailImageLarge: { width: "100%", height: "auto", maxHeight: "none", objectFit: "contain", borderRadius: "8px", backgroundColor: "#0F172A", marginBottom: "24px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" },
  attributeList: { display: "flex", flexDirection: "column", gap: "16px" },
  attributeItem: { display: "flex", flexDirection: "column", borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" },
  attributeLabel: { fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.5px" },
  attributeValue: { fontSize: "15px", color: "#0F172A", lineHeight: "1.5" }
};