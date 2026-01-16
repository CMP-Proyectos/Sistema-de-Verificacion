import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBLQUR7hW1sO_Iyf_g8EvKFXGogu0tbguA"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// interfaz de respuesta
export interface IAValidationResult {
    aprobado: boolean;
    mensaje: string;
    esErrorTecnico?: boolean; // bandera para identificar error de red
}

export const validarFotoConIA = async (file: File, nombreActividad: string): Promise<IAValidationResult> => {
  try {
    const base64Data = await fileToBase64(file);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // prompt "analítico"
    const prompt = `Analiza esta imagen para la actividad: "${nombreActividad}".
                    Si la imagen coincide razonablemente (construcción, planos, herramientas, terreno), aprueba.
                    Si es algo claramente incorrecto (selfie, mascota, pantalla negra, comida), reprueba y di qué es.
                    Responde SOLO JSON: { "aprobado": boolean, "mensaje": "razón corta" }`;
    
    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: file.type } }
    ]);
    
    const response = await result.response;
    const text = response.text();  
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);

  } catch (error: any) {
    console.error("Error IA:", error);
    
    // detección de error técnico (conexión) u offline
    // si falla el fetch o no hay internet, devolvemos un estado especial
    return { 
        aprobado: false, 
        esErrorTecnico: true, // error técnico, no rechazo de imagen
        mensaje: "Validación automática no disponible (Offline)" 
    };
  }
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; 
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}