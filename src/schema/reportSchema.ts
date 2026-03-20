import { z } from 'zod';

// Esquema para coordenadas GPS
const GpsCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Esquema para coordenadas UTM
const UtmCoordinatesSchema = z.object({
  zone: z.string().min(1).max(3),
  east: z.number(),
  north: z.number(),
});

// Esquema para propiedad de registro
const RegisterPropertySchema = z.object({
  id: z.number().positive(),
  text: z.string().min(1).max(500),
  quantity: z.number().min(0).optional(),
});

// Esquema principal para guardar reporte
export const SaveReportSchema = z.object({
  // Validaciones básicas requeridas
  evidenceFile: z.instanceof(Blob, { message: 'El archivo de evidencia es requerido' }),
  sessionUser: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
  }),
  selectedDetail: z.object({
    ID_DetallesActividad: z.number().positive(),
    Latitud: z.number().min(-90).max(90),
    Longitud: z.number().min(-180).max(180),
  }),
  
  // Información de ubicación
  gpsLocation: GpsCoordinatesSchema.optional(),
  utmCoordinates: UtmCoordinatesSchema.optional(),
  
  // Información del reporte
  note: z.string().max(1000).optional(),
  registerProperties: z.array(RegisterPropertySchema).optional(),
  
  // Metadatos del proyecto
  projectInfo: z.object({
    projectId: z.number().positive(),
    frontId: z.number().positive(),
    localityId: z.number().positive(),
    activityName: z.string().min(1).max(100),
  }),
  
  // Estado del sistema
  isAnalyzing: z.boolean(),
  isOnline: z.boolean(),
}).refine((data) => {
  // Validación personalizada: debe tener GPS o usar coordenadas del detalle
  return data.gpsLocation || (data.selectedDetail.Latitud && data.selectedDetail.Longitud);
}, {
  message: "Se requieren coordenadas GPS válidas",
  path: ["gpsLocation"],
}).refine((data) => {
  // Validación personalizada: no debe estar analizando
  return !data.isAnalyzing;
}, {
  message: "No se puede guardar mientras se analiza la imagen",
  path: ["isAnalyzing"],
});

// Esquema para respuesta de guardado exitoso
export const SaveReportResponseSchema = z.object({
  success: z.boolean(),
  recordId: z.number().optional(),
  publicUrl: z.string().url().optional(),
  message: z.string(),
  isOffline: z.boolean(),
  exceeded: z.boolean().optional(),
  accumulated: z.number().optional(),
});

// Tipos inferidos
export type SaveReportInput = z.infer<typeof SaveReportSchema>;
export type SaveReportResponse = z.infer<typeof SaveReportResponseSchema>;

// Función de validación helper
export const validateSaveReportInput = (data: unknown): SaveReportInput => {
  return SaveReportSchema.parse(data);
};

// Función de validación segura (no lanza error)
export const safeValidateSaveReportInput = (data: unknown) => {
  return SaveReportSchema.safeParse(data);
};
