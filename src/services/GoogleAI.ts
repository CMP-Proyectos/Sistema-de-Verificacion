import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. CORRECCIÓN DE ENTORNO: Volvemos al estándar de Expo
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Inicializamos solo si hay clave
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface IAValidationResult {
    aprobado: boolean;
    mensaje: string;
    esErrorTecnico?: boolean;
}

export const validarFotoConIA = async (file: File, nombreActividad: string): Promise<IAValidationResult> => {
    try {
        if (!genAI || !API_KEY) {
            console.error("Falta API KEY de Google (Expo)");
            return { aprobado: true, esErrorTecnico: true, mensaje: "IA no configurada (Pase técnico)" };
        }

        const base64Data = await fileToBase64(file);
        
        // 2. CORRECCIÓN DE MODELO:
        // Usamos 'gemini-2.5-flash' que es el que vimos en tu lista de permisos.
        // Quitamos { apiVersion: 'v1' } para que use la versión por defecto del modelo.
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash" 
        });

        const prompt = `Analiza esta imagen para la actividad de construcción: "${nombreActividad}". 
        Responde EXCLUSIVAMENTE un JSON válido con este formato, sin markdown: 
        { "aprobado": boolean, "mensaje": "razón breve de 10 palabras" }`;
        
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: file.type } }
        ]);
        
        const response = await result.response;
        const text = response.text();  
        
        // Limpieza robusta por si el modelo devuelve markdown
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return JSON.parse(cleanText);

    } catch (error: any) {
        console.error("⚠️ Error IA:", error);
        
        return { 
            aprobado: true, 
            esErrorTecnico: true, 
            mensaje: "IA no disponible, validación manual requerida." 
        };
    }
};

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Quitamos el prefijo "data:image/jpeg;base64,"
            const base64 = result.split(',')[1]; 
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}