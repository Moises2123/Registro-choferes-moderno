// Archivo para verificar la conexión a Supabase
import { supabase } from "./supabase"

export const testSupabaseConnection = async () => {
  try {
    console.log("🔍 Verificando conexión a Supabase...")

    // Verificar variables de entorno
    console.log("📋 Variables de entorno:")
    console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configurada" : "❌ Faltante")
    console.log("SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ Faltante")

    // Probar conexión
    const { data, error } = await supabase.from("chofer_registros").select("count", { count: "exact", head: true })

    if (error) {
      console.error("❌ Error de conexión:", error)
      return false
    }

    console.log("✅ Conexión exitosa a Supabase")
    console.log("📊 Registros en la tabla:", data)
    return true
  } catch (error) {
    console.error("❌ Error inesperado:", error)
    return false
  }
}

// Función para verificar si la tabla existe
export const checkTableExists = async () => {
  try {
    const { data, error } = await supabase.from("chofer_registros").select("id").limit(1)

    if (error && error.code === "42P01") {
      console.error("❌ La tabla 'chofer_registros' no existe")
      return false
    }

    console.log("✅ La tabla 'chofer_registros' existe")
    return true
  } catch (error) {
    console.error("❌ Error verificando tabla:", error)
    return false
  }
}
