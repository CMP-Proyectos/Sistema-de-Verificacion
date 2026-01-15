import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", backgroundColor: "#F5F7FB", fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: "32px", overflowY: "auto" },
  header: { padding: "24px" },
  headerActions: { display: "flex", gap: "8px", marginTop: "12px" },
  headerButton: { border: "none", backgroundColor: "#0B5FFF", color: "#FFFFFF", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  headerButtonOutline: { border: "1px solid #CBD5F5", backgroundColor: "#FFFFFF", color: "#0B5FFF", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  profileButton: { border: "1px solid #0B5FFF", backgroundColor: "#FFFFFF", color: "#0B5FFF", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  
  logo: { maxWidth: "160px", width: "100%", height: "64px", objectFit: "contain", display: "block" },
  logoRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "20px" },
  
  title: { fontSize: "26px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" },
  breadcrumbs: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "12px" },
  breadcrumbActive: { color: "#0F172A", fontWeight: 600 },
  breadcrumbMuted: { color: "#94A3B8" },
  breadcrumbSeparator: { color: "#CBD5F5", fontSize: "14px" },
  
  userEmail: { marginTop: "8px", fontSize: "13px", color: "#0B5FFF", fontWeight: 600 },
  
  card: { backgroundColor: "#FFFFFF", margin: "0 24px 24px", padding: "20px", borderRadius: "16px", boxShadow: "0 8px 16px rgba(15, 23, 42, 0.08)" },
  sectionTitle: { fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "6px" },
  sectionHint: { fontSize: "13px", color: "#64748B", marginBottom: "16px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#1E293B", marginBottom: "8px" },
  
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "15px", color: "#0F172A", marginBottom: "16px", backgroundColor: "#F8FAFC" },
  inputCompact: { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", marginBottom: "6px", backgroundColor: "#F8FAFC" },
  textArea: { width: "100%", boxSizing: "border-box", minHeight: "90px", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#0F172A", backgroundColor: "#F8FAFC" },
  
  primaryButton: { width: "100%", boxSizing: "border-box", backgroundColor: "#0B5FFF", color: "#FFFFFF", border: "none", borderRadius: "12px", padding: "14px", fontSize: "16px", fontWeight: 700, cursor: "pointer", marginTop: "12px" },
  primaryButtonDisabled: { width: "100%", backgroundColor: "#94A3B8", color: "#FFFFFF", border: "none", borderRadius: "12px", padding: "14px", cursor: "not-allowed", marginTop: "12px" },
  secondaryButton: { width: "100%", boxSizing: "border-box", marginTop: "12px", border: "1px solid #CBD5F5", borderRadius: "12px", padding: "12px", backgroundColor: "#FFFFFF", color: "#0B5FFF", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  secondaryButtonSmall: { border: "1px solid #CBD5F5", borderRadius: "10px", padding: "6px 10px", backgroundColor: "#FFFFFF", color: "#0B5FFF", fontSize: "12px", fontWeight: 600, cursor: "pointer", width: "100%" },
  dangerButton: { width: "100%", boxSizing: "border-box", marginTop: "12px", border: "1px solid #FCA5A5", borderRadius: "12px", padding: "12px", backgroundColor: "#FEE2E2", color: "#991B1B", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  ghostButton: { width: "100%", boxSizing: "border-box", marginBottom: "12px", border: "1px dashed #CBD5F5", borderRadius: "12px", padding: "10px", backgroundColor: "#FFFFFF", color: "#64748B", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  
  linkText: { color: '#0B5FFF', fontWeight: 600, cursor: 'pointer', marginLeft: '5px', textDecoration: 'none' },
  authFooter: { marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#64748B' },

  optionGrid: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  optionButton: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "10px 12px", backgroundColor: "#F8FAFC", fontSize: "13px", fontWeight: 600, color: "#0F172A", cursor: "pointer" },
  
  searchBlock: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" },
  searchInput: { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "#0F172A", backgroundColor: "#F8FAFC" },
  searchResults: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "8px", backgroundColor: "#FFFFFF" },
  searchOption: { border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px 12px", backgroundColor: "#F8FAFC", textAlign: "left", cursor: "pointer" },
  searchOptionTitle: { display: "block", fontSize: "13px", fontWeight: 600, color: "#0F172A" },
  searchOptionMeta: { display: "block", fontSize: "12px", color: "#64748B", marginTop: "4px" },
  
  mapPlaceholder: { borderRadius: "14px", overflow: "hidden", marginBottom: "16px", border: "1px solid #E2E8F0" },
  mapFrame: { width: "100%", height: "220px", border: "0" },
  locationGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" },
  locationCard: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px", backgroundColor: "#FFFFFF" },
  locationTitle: { fontSize: "13px", fontWeight: 700, color: "#0F172A", display: "block", marginBottom: "6px" },
  locationHint: { fontSize: "12px", color: "#475569", marginBottom: "12px" },
  
  pinCard: { width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "14px", marginBottom: "12px", backgroundColor: "#FFFFFF", textAlign: "left", cursor: "pointer" },
  pinHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  pinTitle: { fontSize: "15px", fontWeight: 700, color: "#0F172A" },
  statusPill: { padding: "4px 10px", borderRadius: "999px", backgroundColor: "#FEF3C7", fontSize: "12px", fontWeight: 600, color: "#0F172A", textTransform: "capitalize" },
  pinMeta: { fontSize: "12px", color: "#475569" },
  pinAction: { marginTop: "6px", fontSize: "12px", color: "#0B5FFF", fontWeight: 600 },
  
  formBlock: { marginBottom: "16px" },
  evidenceBox: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC", marginBottom: "10px" },
  evidenceImage: { width: "100%", height: "160px", objectFit: "cover", borderRadius: "10px" },
  
  historyContainer: { display: "flex", height: "300px", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", marginTop: "16px", backgroundColor: "#FFFFFF" },
  historyList: { width: "40%", borderRight: "1px solid #E2E8F0", overflowY: "auto", backgroundColor: "#F8FAFC" },
  historyDetail: { flex: 1, padding: "12px", overflowY: "auto", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", gap: "12px" },
  historyItem: { padding: "10px", borderBottom: "1px solid #E2E8F0", cursor: "pointer", fontSize: "12px" },
  historyItemActive: { backgroundColor: "#FFFFFF", borderLeft: "4px solid #0B5FFF", paddingLeft: "12px" },
  
  readOnlyBlock: { display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "16px", padding: "12px", borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" },
  readOnlyLabel: { display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" },
  readOnlyValue: { fontSize: "13px", fontWeight: 600, color: "#0F172A" },
  profileMessage: { marginTop: "8px", padding: "10px 12px", borderRadius: "10px", backgroundColor: "#F1F5F9", fontSize: "13px", color: "#0F172A" },
  detailInfoBox: { borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px" },
  detailRow: { display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px", marginBottom: "6px", gap: "12px" },
  detailLabel: { color: "#64748B", fontSize: "12px", fontWeight: 700 },
  detailValue: { color: "#0F172A", fontSize: "13px", fontWeight: 600, textAlign: "right" },
  buttonsRow: { display: "flex", gap: "8px" },
  
  tableContainer: { overflowX: "auto", border: "1px solid #ccc", borderRadius: "4px", marginTop: "10px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  tableHeaderRow: { backgroundColor: "#f5f5f5", textAlign: "left" },
  tableTh: { padding: "8px", borderBottom: "1px solid #ddd" },
  tableRow: { cursor: "pointer", borderBottom: "1px solid #eee", backgroundColor: "transparent" },
  tableRowActive: { backgroundColor: "#e6f7ff", cursor: "pointer", borderBottom: "1px solid #eee" },
  tableRowHeader: { padding: '8px', borderBottom: '1px solid #ddd' },
  
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" },
  modalCard: { backgroundColor: "#FFFFFF", width: "100%", maxWidth: "400px", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column", gap: "16px" },
  modalButtons: { display: "flex", gap: "10px", marginTop: "20px", width: "100%" },
  emptyText: { fontSize: "12px", color: "#94A3B8" },
  emptyState: { padding: "16px", fontSize: "13px", color: "#94A3B8", textAlign: "center" },
};