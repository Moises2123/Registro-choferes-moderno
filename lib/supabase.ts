import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type ChoferRegistro = {
  id: number
  nombre_chofer: string
  tipo: "Entrada" | "Salida"
  destino: string
  diligencia: string
  sustento: string
  solicitud: string
  responsable: string
  fecha_hora: string
  created_at: string
  updated_at: string
}

// Agregar función para formatear fecha en zona horaria de Lima
export const getPeruDateTime = () => {
  const now = new Date()
  // Crear fecha en zona horaria de Lima
  const peruTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }))
  return peruTime
}
