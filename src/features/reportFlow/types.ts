// src/features/reportFlow/types.ts

// Estados de navegación
export type Step =
    | "auth"
    | "project"
    | "substation"
    | "front"
    | "locality"
    | "item"
    | "group"
    | "activity"
    | "detail"
    | "confirm"
    | "map"
    | "form"
    | "profile"
    | "user_records"
    | "files";

// Estructura de un registro de usuario (base de datos)
export interface UserRecord { 
    id_registro: number; 
    id_verificada?: number | null;
    user_id?: string | null;
    fecha_subida: string; 
    url_foto: string | null; 
    nombre_actividad: string; 
    nombre_localidad: string; 
    nombre_detalle: string; 
    nombre_grupo?: string | null;
    nombre_item?: string | null;
    nombre_subestacion?: string | null;
    comentario: string | null; 
    ruta_archivo: string | null; 
    bucket: string | null; 
    latitud: number | null; 
    longitud: number | null;
    id_proyecto?: number | null;
    id_frente?: number | null;
    id_localidad?: number | null;
    id_detalle?: number | null;
    id_actividad?: number | null;
    nombre_proyecto?: string | null;
    nombre_frente?: string | null;
    total_imagenes?: number;
    cantidad: number;
}

export interface EvidenceImage {
    id: string;
    file: File;
    previewUrl: string;
}

// Estructura para las propiedades/atributos dinámicos
export interface ActivitiesTypes { 
    Tipo_Actividad: string; 
    ID_Propiedad: number; 
    Propiedad: string; 
}

// Estados para componentes UI
export interface ToastState {
    msg: string;
    type: 'success' | 'error' | 'info';
}

export interface ConfirmModalState {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
}
