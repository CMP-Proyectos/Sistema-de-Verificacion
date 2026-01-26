// src/features/reportFlow/types.ts

// Estados de navegación
export type Step = "auth" | "project" | "front" | "locality" | "detail" | "activity" | "map" | "form" | "profile" | "user_records" | "files";

// Estructura de un registro de usuario (base de datos)
export interface UserRecord { 
    id_registro: number; 
    fecha_subida: string; 
    url_foto: string | null; 
    nombre_actividad: string; 
    nombre_localidad: string; 
    nombre_detalle: string; 
    comentario: string | null; 
    ruta_archivo: string | null; 
    bucket: string | null; 
    latitud: number | null; 
    longitud: number | null;
    nombre_proyecto?: string;
    nombre_frente?: string;
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
}
