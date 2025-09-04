"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    // Manejar el hash fragment de la URL (donde Supabase pone los tokens)
    const handleAuthCallback = async () => {
      try {
        // Obtener el hash de la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        const type = hashParams.get("type")

        console.log("Auth callback params:", { accessToken: !!accessToken, refreshToken: !!refreshToken, type })

        if (type === "recovery" && accessToken && refreshToken) {
          // Establecer la sesión con los tokens de recuperación
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error("Error setting session:", error)
            setError("Error al procesar el enlace de recuperación. Inténtalo de nuevo.")
            setIsCheckingSession(false)
            return
          }

          if (data.session) {
            console.log("Session established successfully")
            setIsValidSession(true)
          }
        } else {
          // Verificar si ya hay una sesión activa
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()

          if (session && !error) {
            console.log("Existing session found")
            setIsValidSession(true)
          } else {
            console.log("No valid session found")
            setError("Enlace de recuperación inválido o expirado. Solicita uno nuevo.")
          }
        }
      } catch (error) {
        console.error("Error in auth callback:", error)
        setError("Error inesperado al procesar el enlace. Inténtalo de nuevo.")
      } finally {
        setIsCheckingSession(false)
      }
    }

    handleAuthCallback()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
      console.log("Attempting to update password...")

      const { data, error } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (error) {
        console.error("Password update error:", error)
        setError(`Error al actualizar la contraseña: ${error.message}`)
        return
      }

      console.log("Password updated successfully:", data)
      setSuccess(true)

      // Cerrar sesión después de cambiar contraseña para forzar nuevo login
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push("/?message=password-updated")
      }, 3000)
    } catch (error) {
      console.error("Unexpected error:", error)
      setError("Error inesperado. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de carga mientras verificamos la sesión
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
            <CardTitle className="text-2xl font-bold">Verificando Enlace</CardTitle>
            <CardDescription>Procesando tu solicitud de recuperación...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Pantalla de éxito
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">¡Contraseña Actualizada!</CardTitle>
            <CardDescription>
              Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-4">Redirigiendo...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Crear Nueva Contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña para completar la recuperación</CardDescription>
        </CardHeader>

        <CardContent>
          {!isValidSession ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">¿Problemas con el enlace?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Asegúrate de usar el enlace más reciente</li>
                  <li>• Los enlaces expiran después de 1 hora</li>
                  <li>• Copia y pega la URL completa</li>
                  <li>• Solicita un nuevo enlace si es necesario</li>
                </ul>
              </div>

              <Button onClick={() => router.push("/")} className="w-full bg-blue-600 hover:bg-blue-700">
                Volver al Inicio de Sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu nueva contraseña"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Verificar Nueva Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirma tu nueva contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-blue-800 mb-2">Requisitos de contraseña:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className={formData.password.length >= 6 ? "text-green-700" : ""}>
                    • Mínimo 6 caracteres {formData.password.length >= 6 ? "✓" : ""}
                  </li>
                  <li
                    className={
                      formData.password === formData.confirmPassword && formData.password.length > 0
                        ? "text-green-700"
                        : ""
                    }
                  >
                    • Las contraseñas deben coincidir{" "}
                    {formData.password === formData.confirmPassword && formData.password.length > 0 ? "✓" : ""}
                  </li>
                  <li>• Se recomienda usar letras, números y símbolos</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || formData.password.length < 6 || formData.password !== formData.confirmPassword}
              >
                {loading ? "Actualizando..." : "Crear Nueva Contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
