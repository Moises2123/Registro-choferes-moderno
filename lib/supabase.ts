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

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: "admin" | "user"
  created_at: string
  updated_at: string
}

export type ActivityLog = {
  id: number
  user_id: string | null
  user_email: string | null
  action: string
  table_name: string | null
  record_id: number | null
  old_data: any
  new_data: any
  created_at: string
}

// Agregar función para formatear fecha en zona horaria de Lima
export const getPeruDateTime = () => {
  const now = new Date()
  // Crear fecha en zona horaria de Lima
  const peruTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }))
  return peruTime
}

// Funciones de autenticación
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

  return { data, error }
}

// Función para verificar si el usuario es admin
export const isAdmin = async () => {
  const { user } = await getCurrentUser()
  if (!user) return false

  const { data: profile } = await getUserProfile(user.id)
  return profile?.role === "admin"
}

// Función para registrar actividad - CORREGIDA
export const logActivity = async (
  action: string,
  tableName?: string | null,
  recordId?: number | null,
  oldData?: any,
  newData?: any,
) => {
  try {
    // First check if we have a valid session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error getting session for activity log:", sessionError)
      return { error: sessionError }
    }

    if (!session?.user) {
      console.warn("No authenticated user found for activity log")
      return { error: new Error("No user authenticated") }
    }

    // Check if activity_logs table exists by trying to select from it
    const { error: tableCheckError } = await supabase.from("activity_logs").select("id").limit(1)

    if (tableCheckError) {
      console.warn("Activity logs table not available:", tableCheckError.message)
      return { error: tableCheckError }
    }

    const activityData = {
      user_id: session.user.id,
      user_email: session.user.email || null,
      action: action,
      table_name: tableName || null,
      record_id: recordId || null,
      old_data: oldData || null,
      new_data: newData || null,
    }

    console.log("Attempting to log activity:", activityData)

    const { data, error } = await supabase.from("activity_logs").insert([activityData]).select()

    if (error) {
      console.error("Error inserting activity log:", error)
      return { error }
    }

    console.log("Activity logged successfully:", data)
    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error in logActivity:", error)
    return { error }
  }
}

// Asegurar que supabase esté disponible para reset de contraseña
