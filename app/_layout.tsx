import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, // <--- ESTA LÍNEA ELIMINA EL ENCABEZADO AZUL
        animation: 'fade',  // Opcional: hace la transición más suave
        contentStyle: { backgroundColor: '#F5F7FB' } // Mantiene el fondo gris claro base
      }} 
    />
  );
}