import React, { useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useReportFlow } from "../../hooks/useReportFlow";
import { styles } from "../../theme/styles";

import { TopNav } from "./components/TopNav";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";
import { ConfirmModal } from "./components/ConfirmModal";
import { PhotoEditModal } from "./components/PhotoEditModal";

import { AuthScreen } from "./screens/AuthScreen";
import { SelectionScreen } from "./screens/SelectionScreen";
import { EvidenceFormScreen } from "./screens/EvidenceFormScreen";
import { UserGalleryScreen } from "./screens/UserGalleryScreen";
import { ActivityConfirmationScreen } from "./screens/ActivityConfirmationScreen";

const selectionCardStyle = {
  ...styles.gridItem,
  display: "flex",
  flexDirection: "row" as const,
  justifyContent: "space-between",
  alignItems: "center",
  textAlign: "left" as const,
  padding: "16px",
  width: "100%",
  minHeight: "auto",
  borderLeft: "4px solid #003366",
  boxSizing: "border-box" as const,
};

export default function ReportFlowPage() {
  const flow = useReportFlow();

  const mapUrl = flow.getMapUrl();
  const displayLat = flow.gpsLocation?.latitude ?? flow.selectedDetail?.Latitud ?? 0;
  const displayLng = flow.gpsLocation?.longitude ?? flow.selectedDetail?.Longitud ?? 0;

  const selectedProjectName = useMemo(
    () => flow.projects?.find((project) => project.ID_Proyectos === flow.selectedProjectId)?.Proyecto_Nombre,
    [flow.projects, flow.selectedProjectId]
  );
  const selectedFrontName = useMemo(
    () => flow.fronts?.find((front) => front.ID_Frente === flow.selectedFrontId)?.Nombre_Frente,
    [flow.fronts, flow.selectedFrontId]
  );
  const selectedLocalityName = useMemo(
    () => flow.localities?.find((locality) => locality.ID_Localidad === flow.selectedLocalityId)?.Nombre_Localidad,
    [flow.localities, flow.selectedLocalityId]
  );

  return (
    <div style={styles.page}>
      <TopNav
        step={flow.step}
        isOnline={flow.isOnline}
        onBack={flow.goBack}
        breadcrumbNames={{
          project: selectedProjectName,
          front: selectedFrontName,
          locality: selectedLocalityName,
          item: flow.selectedItem ?? undefined,
          group: flow.selectedGroup ?? undefined,
          activity: flow.selectedActivity?.Nombre_Actividad,
          detail: flow.selectedDetail?.Nombre_Detalle,
        }}
      />

      <div style={styles.container}>
        {flow.step === "auth" && (
          <AuthScreen
            authEmail={flow.authEmail}
            setAuthEmail={flow.setAuthEmail}
            authPassword={flow.authPassword}
            setAuthPassword={flow.setAuthPassword}
            authMode={flow.authMode}
            setAuthMode={flow.setAuthMode}
            authMessage={flow.authMessage}
            isLoading={flow.isLoading}
            authLoadingLabel={flow.authLoadingLabel}
            syncStatus={flow.syncStatus}
            onLogin={flow.handleLogin}
          />
        )}

        {flow.step === "project" && (
          <SelectionScreen
            title="Seleccionar Proyecto"
            items={flow.projects.map((project) => ({
              id: project.ID_Proyectos,
              label: project.Proyecto_Nombre,
            }))}
            onSelect={flow.selectProject}
          />
        )}

        {flow.step === "front" && (
          <SelectionScreen
            title="Seleccionar Frente"
            items={flow.fronts.map((front) => ({
              id: front.ID_Frente,
              label: front.Nombre_Frente,
            }))}
            onSelect={flow.selectFront}
          />
        )}

        {flow.step === "locality" && (
          <div style={styles.card}>
            <h2 style={styles.heading}>SELECCIONAR LOCALIDAD</h2>
            <input
              placeholder="Buscar localidad..."
              value={flow.localitySearch}
              onChange={(event) => flow.setLocalitySearch(event.target.value)}
              style={styles.input}
              autoFocus
            />

            <div style={styles.scrollableY}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {flow.filteredLocalities.length > 0 ? (
                  flow.filteredLocalities.map((locality) => (
                    <button
                      key={locality.ID_Localidad}
                      onClick={() => flow.selectLocality(locality.ID_Localidad)}
                      style={{ ...selectionCardStyle, fontSize: "14px", fontWeight: "600" }}
                    >
                      {locality.Nombre_Localidad}
                    </button>
                  ))
                ) : (
                  <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8" }}>
                    No se encontraron localidades
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {flow.step === "item" && (
          <div style={styles.card}>
            <h2 style={styles.heading}>SELECCIONAR ITEM</h2>
            <input
              placeholder="Buscar item..."
              value={flow.itemSearch}
              onChange={(event) => flow.setItemSearch(event.target.value)}
              style={styles.input}
              autoFocus
            />

            <div style={styles.scrollableY}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {flow.filteredItems.length > 0 ? (
                  flow.filteredItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => flow.selectItem(item)}
                      style={selectionCardStyle}
                    >
                      <div style={{ flex: 1, paddingRight: "12px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#1E293B" }}>{item}</div>
                        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                          {selectedLocalityName || "Localidad"}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8" }}>
                    No se encontraron items para esta localidad
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {flow.step === "group" && (
          <div style={styles.card}>
            <h2 style={styles.heading}>SELECCIONAR GRUPO</h2>
            <input
              placeholder="Buscar grupo..."
              value={flow.groupSearch}
              onChange={(event) => flow.setGroupSearch(event.target.value)}
              style={styles.input}
              autoFocus
            />

            <div style={styles.scrollableY}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {flow.filteredGroups.length > 0 ? (
                  flow.filteredGroups.map((group) => {
                    const isExpanded = Boolean(flow.expandedGroups[group]);
                    const previewActivities = flow.groupActivityPreviewMap[group] || [];

                    return (
                      <button
                        key={group}
                        onClick={() => flow.selectGroup(group)}
                        style={{
                          ...selectionCardStyle,
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1E293B" }}>{group}</div>
                            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                              {flow.selectedItem || "Item"}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              flow.toggleGroupExpanded(group);
                            }}
                            style={{
                              border: "1px solid #CBD5E1",
                              backgroundColor: "#F8FAFC",
                              color: "#334155",
                              borderRadius: "6px",
                              width: "34px",
                              height: "34px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div
                            onClick={(event) => event.stopPropagation()}
                            style={{
                              borderTop: "1px solid #E2E8F0",
                              paddingTop: "12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            {previewActivities.length > 0 ? (
                              previewActivities.map((activity) => (
                                <div key={activity.ID_Actividad} style={{ fontSize: "12px", color: "#475569" }}>
                                  {activity.Nombre_Actividad}
                                </div>
                              ))
                            ) : (
                              <div style={{ fontSize: "12px", color: "#94A3B8" }}>Sin actividades para este grupo</div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8" }}>
                    No se encontraron grupos para este item
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {flow.step === "activity" && (
          <div style={styles.card}>
            <h2 style={styles.heading}>SELECCIONAR ACTIVIDAD</h2>
            <p style={{ fontSize: "12px", color: "#64748B", margin: "-6px 0 16px" }}>
              Los conductores mostrarán la longitud en metros (m.) del vano.
            </p>
            <div style={styles.scrollableY}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {flow.filteredActivities.length > 0 ? (
                  flow.filteredActivities.map((activity) => (
                    <button
                      key={activity.ID_Actividad}
                      onClick={() => flow.selectActivity(activity.ID_Actividad)}
                      style={selectionCardStyle}
                    >
                      <div style={{ flex: 1, paddingRight: "10px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>
                          {activity.Nombre_Actividad}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                          {activity.Grupo || "Sin grupo"} / {activity.Item || "Sin item"}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8" }}>
                    No se encontraron actividades para este grupo
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {flow.step === "detail" && (
          <div style={styles.card}>
            <h2 style={styles.heading}>Seleccionar N° Estructura</h2>
            <input
              placeholder="Filtrar por detalle..."
              value={flow.detailSearch}
              onChange={(event) => flow.setDetailSearch(event.target.value)}
              style={styles.input}
              autoFocus
            />
            <div style={styles.scrollableY}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {flow.filteredDetails.length > 0 ? (
                  flow.filteredDetails.map((detail) => (
                    <button
                      key={detail.ID_DetallesActividad}
                      onClick={() => flow.selectDetail(detail)}
                      style={{
                        ...selectionCardStyle,
                        padding: "16px",
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: "10px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>
                          {detail.Nombre_Detalle}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                          {detail.activityName}
                          {detail.activityGroup ? ` / ${detail.activityGroup}` : ""}
                        </div>
                      </div>
                      {detail.activityItem && (
                        <div style={{ backgroundColor: "#F1F5F9", padding: "4px 8px", borderRadius: "4px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#003366",
                              fontFamily: "monospace",
                            }}
                          >
                            {detail.activityItem}
                          </span>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8" }}>Sin resultados</div>
                )}
              </div>
            </div>
          </div>
        )}

        {flow.step === "confirm" && (
          <ActivityConfirmationScreen
            selectedProjectName={selectedProjectName ?? null}
            selectedFrontName={selectedFrontName ?? null}
            selectedLocalityName={selectedLocalityName ?? null}
            selectedItem={flow.selectedItem}
            selectedGroup={flow.selectedGroup}
            selectedActivity={flow.selectedActivity}
            selectedDetail={flow.selectedDetail}
            onContinue={() => flow.setStep("map")}
          />
        )}

        {(flow.step === "map" || flow.step === "form") && (
          <EvidenceFormScreen
            isOnline={flow.isOnline}
            mapUrl={mapUrl}
            displayLat={displayLat}
            displayLng={displayLng}
            isFetchingGps={flow.isFetchingGps}
            onCaptureGps={flow.handleCaptureGps}
            utmZone={flow.utmZone}
            setUtmZone={flow.setUtmZone}
            utmEast={flow.utmEast}
            setUtmEast={flow.setUtmEast}
            utmNorth={flow.utmNorth}
            setUtmNorth={flow.setUtmNorth}
            onUpdateUtm={flow.handleUpdateFromUtm}
            evidencePreview={flow.evidencePreview}
            isAnalyzing={flow.isAnalyzing}
            aiFeedback={flow.aiFeedback}
            onCaptureFile={flow.handleCaptureFile}
            note={flow.note}
            setNote={flow.setNote}
            registerProperties={flow.registerProperties}
            registerPropId={flow.registerPropId}
            setRegisterPropId={flow.setRegisterPropId}
            registerDetailText={flow.registerDetailText}
            setRegisterDetailText={flow.setRegisterDetailText}
            registerDetailQuantity={flow.registerDetailQuantity}
            setRegisterDetailQuantity={flow.setRegisterDetailQuantity}
            isLoading={flow.isLoading}
            onSave={() => {
              flow.saveReport();
            }}
          />
        )}

        {flow.step === "profile" && (
          <div style={styles.card}>
            <h2 style={styles.heading}>Mi Perfil</h2>
            <div style={{ marginBottom: "20px" }}>
              <label style={styles.label}>Usuario</label>
              <div style={{ fontSize: "14px", color: "#1E293B" }}>{flow.sessionUser?.email}</div>
            </div>
            <input value={flow.profileName} onChange={(event) => flow.setProfileName(event.target.value)} style={styles.input} placeholder="Nombres" />
            <input value={flow.profileLastName} onChange={(event) => flow.setProfileLastName(event.target.value)} style={styles.input} placeholder="Apellidos" />
            <button onClick={flow.saveProfile} disabled={flow.isProfileSaving} style={styles.btnPrimary}>
              Actualizar Datos
            </button>
            <button onClick={flow.handleLogout} style={{ ...styles.btnSecondary, width: "100%", marginTop: "20px" }}>
              Cerrar Sesión
            </button>
          </div>
        )}

        {flow.step === "user_records" && (
          <UserGalleryScreen
            records={flow.userRecords}
            isLoading={flow.isLoadingRecords}
            selectedRecordId={flow.selectedRecordId}
            onSelectRecord={flow.setSelectedRecordId}
            onDelete={(record) => flow.requestDeleteRecord(record)}
            onEdit={flow.openEditModal}
          />
        )}

        {flow.step === "files" && (
          <div style={styles.card}>
            <div style={styles.flexBetween}>
              <h2 style={{ ...styles.heading, borderBottom: "none", margin: 0 }}>Exportar Datos</h2>
              <button onClick={() => flow.handleDownloadCSV(flow.userRecords)} style={styles.btnSecondary}>
                DESCARGAR CSV
              </button>
            </div>
            <div style={styles.scrollableY}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "500px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>
                    <th style={{ padding: "10px", textAlign: "left" }}>ID</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Actividad</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {flow.userRecords.map((record) => {
                    const isSelected = flow.selectedRecordId === record.id_registro;
                    return (
                      <tr
                        key={record.id_registro}
                        onClick={() => flow.setSelectedRecordId(record.id_registro)}
                        style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: isSelected ? "#E0F2FE" : "white" }}
                      >
                        <td style={{ padding: "8px" }}>{record.id_registro}</td>
                        <td style={{ padding: "8px", fontWeight: "600" }}>{record.nombre_actividad}</td>
                        <td style={{ padding: "8px" }}>{new Date(record.fecha_subida).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {flow.step !== "auth" && (
        <BottomNav
          step={flow.step}
          onNavHome={flow.handleGoHome}
          onNavRecords={() => flow.setStep("user_records")}
          onNavFiles={() => flow.setStep("files")}
          onNavProfile={() => flow.setStep("profile")}
        />
      )}

      <PhotoEditModal
        open={flow.isPhotoModalOpen}
        previewUrl={flow.editPreviewUrl}
        comment={flow.editComment}
        onCommentChange={flow.setEditComment}
        onFileSelect={flow.handleEditFileSelect}
        onClose={flow.closeEditModal}
        onSave={flow.saveRecordEdits}
      />
      <Toast toast={flow.toast} />
      <ConfirmModal modal={flow.confirmModal} onClose={() => flow.setConfirmModal(null)} />
    </div>
  );
}
