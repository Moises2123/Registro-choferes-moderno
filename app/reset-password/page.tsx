"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  })

  // Verificar si hay un token de recuperación en la URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get("access_token")
    const refreshToken = hashParams.get("refresh_token")
    const type = hashParams.get("type")

    if (type === "recovery" && accessToken && refreshToken) {
      // Establecer la sesión con los tokens de recuperación
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validaciones
      if (passwords.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }

      if (passwords.password !== passwords.confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }

      // Actualizar contraseña usando Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwords.password,
      })

      if (error) {
        console.error("Error updating password:", error)
        setError(error.message)
        return
      }

      setSuccess("¡Contraseña actualizada exitosamente!")

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push("/?message=password-updated")
      }, 2000)
    } catch (error) {
      console.error("Unexpected error:", error)
      setError("Error inesperado. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña segura</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.password}
                  onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
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
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Indicador de fortaleza de contraseña */}
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-2">Requisitos de contraseña:</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li
                  className={`flex items-center ${passwords.password.length >= 6 ? "text-green-600" : "text-slate-400"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${passwords.password.length >= 6 ? "bg-green-500" : "bg-slate-300"}`}
                  ></div>
                  Mínimo 6 caracteres
                </li>
                <li
                  className={`flex items-center ${passwords.password === passwords.confirmPassword && passwords.password.length > 0 ? "text-green-600" : "text-slate-400"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${passwords.password === passwords.confirmPassword && passwords.password.length > 0 ? "bg-green-500" : "bg-slate-300"}`}
                  ></div>
                  Las contraseñas coinciden
                </li>
              </ul>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
