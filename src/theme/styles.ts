import React from "react";

export const styles: Record<string, React.CSSProperties> = {
  // --- LAYOUT GENERAL ---
  page: { 
    minHeight: "100vh", 
    backgroundColor: "#F5F7FB", 
    fontFamily: "system-ui, -apple-system, sans-serif" 
  },
  
  // --- NUEVO NAVBAR SUPERIOR ---
  navbar: {
    backgroundColor: "#0F172A", // Azul oscuro profesional
    padding: "15px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 1000
  },
  navbarBrand: {
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  hamburgerBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    padding: "0 5px"
  },
  
  // --- MENÚ DESPLEGABLE (HAMBURGUESA) ---
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    position: "absolute",
    top: "54px", // Justo debajo del navbar
    left: 0,
    right: 0,
    zIndex: 999,
    display: "flex",
    flexDirection: "column"
  },
  menuItem: {
    padding: "15px 20px",
    borderBottom: "1px solid #F1F5F9",
    color: "#334155",
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
    padding: "10px 20px",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px"
  },
  navControls: {
    padding: "10px 20px 0",
    display: "flex",
    gap: "10px"
  },
  navButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #CBD5F5",
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    flex: 1, // Para que ocupen espacio igual
    textAlign: "center"
  },
  navButtonPrimary: {
    padding: "8px 16px",
    borderRadius: "8px",
    backgroundColor: "#0B5FFF",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    flex: 1
  },

  // --- COMPONENTES EXISTENTES (Mantener) ---
  breadcrumbs: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", padding: "10px 20px", fontSize: "12px" },
  breadcrumbItem: { color: "#0F172A", fontWeight: 600 },
  breadcrumbSeparator: { color: "#CBD5F5", fontSize: "14px" },
  
  card: { backgroundColor: "#FFFFFF", margin: "0 24px 24px", padding: "20px", borderRadius: "16px", boxShadow: "0 8px 16px rgba(15, 23, 42, 0.08)" },
  sectionTitle: { fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "6px" },
  
  label: { fontSize: "13px", fontWeight: 600, color: "#1E293B", marginBottom: "8px", display: "block" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "15px", color: "#0F172A", marginBottom: "16px", backgroundColor: "#F8FAFC" },
  inputCompact: { border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px", fontSize: "13px", backgroundColor: "#FFFFFF" },
  textArea: { width: "100%", boxSizing: "border-box", minHeight: "90px", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#0F172A", backgroundColor: "#F8FAFC", marginBottom: "16px" },
  
  primaryButton: { width: "100%", boxSizing: "border-box", backgroundColor: "#0B5FFF", color: "#FFFFFF", border: "none", borderRadius: "12px", padding: "14px", fontSize: "16px", fontWeight: 700, cursor: "pointer", marginTop: "12px" },
  primaryButtonDisabled: { width: "100%", boxSizing: "border-box", backgroundColor: "#94A3B8", color: "#FFFFFF", border: "none", borderRadius: "12px", padding: "14px", fontSize: "16px", fontWeight: 700, cursor: "not-allowed", marginTop: "12px" },
  secondaryButton: { width: "100%", boxSizing: "border-box", marginTop: "12px", border: "1px solid #CBD5F5", borderRadius: "12px", padding: "12px", backgroundColor: "#FFFFFF", color: "#0B5FFF", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  secondaryButtonSmall: { border: "1px solid #CBD5F5", borderRadius: "10px", padding: "6px 12px", backgroundColor: "#FFFFFF", color: "#0B5FFF", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  dangerButton: { width: "100%", boxSizing: "border-box", marginTop: "12px", border: "1px solid #FCA5A5", borderRadius: "12px", padding: "12px", backgroundColor: "#FEE2E2", color: "#991B1B", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  
  optionGrid: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  optionButton: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "10px 12px", backgroundColor: "#F8FAFC", fontSize: "13px", fontWeight: 600, color: "#0F172A", cursor: "pointer" },
  
  mapPlaceholder: { borderRadius: "14px", overflow: "hidden", border: "1px solid #E2E8F0", backgroundColor: "#F1F5F9" },
  mapFrame: { width: "100%", border: "0" },
  emptyState: { padding: "16px", fontSize: "13px", color: "#94A3B8", textAlign: "center" },
  
  detailInfoBox: { borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px", marginBottom: "10px" },
  
  evidenceBox: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC", marginBottom: "10px", flexDirection: "column" },
  evidenceImage: { width: "100%", height: "auto", objectFit: "contain", borderRadius: "10px" },
  
  searchInput: { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#0F172A", backgroundColor: "#F8FAFC", marginBottom: "10px" },
  searchResults: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "8px", backgroundColor: "#FFFFFF" },
  searchOption: { border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px 12px", backgroundColor: "#F8FAFC", textAlign: "left", cursor: "pointer" },
  searchOptionTitle: { display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A" },
  searchOptionMeta: { display: "block", fontSize: "12px", color: "#64748B", marginTop: "4px" },

  readOnlyBlock: { display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "16px", padding: "12px", borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" },
  profileMessage: { marginTop: "8px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "#F1F5F9", fontSize: "13px", color: "#0F172A" },
  
  authFooter: { marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#64748B" },
  linkText: { color: "#0B5FFF", fontWeight: 600, cursor: "pointer", textDecoration: "underline" },

  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" },
  modalCard: { backgroundColor: "#FFFFFF", width: "100%", maxWidth: "400px", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column" },
  modalButtons: { display: "flex", gap: "10px", marginTop: "20px", width: "100%" },

  gridContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px", padding: "10px 0", marginBottom: "20px" },
  cardItem: { backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", transition: "transform 0.2s ease", height: "100%" },
  cardImagePlaceholder: { width: "100%", height: "120px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "30px" },
  cardImage: { width: "100%", height: "120px", objectFit: "cover", borderBottom: "1px solid #F1F5F9" },
  cardFooter: { padding: "8px", display: "flex", flexDirection: "column", gap: "2px", flex: 1, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: "11px", fontWeight: "600", color: "#0F172A", lineHeight: "1.3", textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  
  detailOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.98)", zIndex: 2000, display: "flex", flexDirection: "column", overflowY: "auto" },
  detailHeader: { padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", backgroundColor: "#FFFFFF", position: "sticky", top: 0, zIndex: 10, gap: "12px" },
  backArrowBtn: { background: "none", border: "none", fontSize: "24px", color: "#334155", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" },
  detailContent: { padding: "24px", maxWidth: "600px", margin: "0 auto", width: "100%", boxSizing: "border-box", flex: 1 },
  detailImageLarge: { width: "100%", height: "auto", maxHeight: "none", objectFit: "contain", borderRadius: "12px", backgroundColor: "#000", marginBottom: "20px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" },
  attributeList: { display: "flex", flexDirection: "column", gap: "10px" },
  attributeItem: { display: "flex", flexDirection: "column", borderBottom: "1px solid #F1F5F9", paddingBottom: "6px" },
  attributeLabel: { fontSize: "10px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "2px" },
  attributeValue: { fontSize: "13px", color: "#0F172A", lineHeight: "1.4" }
};