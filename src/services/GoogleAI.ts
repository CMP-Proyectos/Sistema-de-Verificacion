import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBLQUR7hW1sO_Iyf_g8EvKFXGogu0tbguA"; 
const genAI = new GoogleGenerativeAI(API_KEY);

export const validarFotoConIA = async (file: File, nombreActividad: string) => {
  try {
    const base64Data = await fileToBase64(file);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// Cambia la instrucción estricta por esta más flexible:
    const prompt = `Actúa como asistente de obra. Actividad: ${nombreActividad}.
                    Analiza la imagen.
                    APRUEBA si la imagen muestra una construcción, suelo, herramientas o algo técnico.
                    SOLO REPRUEBA si es algo absurdo (una selfie, una mascota, pantalla negra, autos, comida).
                    Responde solo este JSON: { "aprobado": boolean, "mensaje": "razón breve" }`;    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: file.type } }
    ]);
    const response = await result.response;
    const text = response.text();  
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error("Error IA:", error);
    if (error.message?.includes("404") || error.message?.includes("not found")) {
        return { 
            aprobado: false, 
            mensaje: "Error técnico: El modelo de IA no está disponible en esta región/cuenta. Prueba usar 'gemini-pro'." 
        };
    }
    return { 
        aprobado: false, 
        mensaje: `Error: ${error.message || "Desconocido"}` 
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