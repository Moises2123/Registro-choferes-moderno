"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function ChangePassword() {
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validaciones
      if (passwords.newPassword.length < 6) {
        setError("La nueva contraseña debe tener al menos 6 caracteres")
        return
      }

      if (passwords.newPassword !== passwords.confirmPassword) {
        setError("Las contraseñas nuevas no coinciden")
        return
      }

      if (passwords.currentPassword === passwords.newPassword) {
        setError("La nueva contraseña debe ser diferente a la actual")
        return
      }

      // Primero verificar la contraseña actual
      const { data: user } = await supabase.auth.getUser()
      if (!user.user?.email) {
        setError("No se pudo verificar el usuario actual")
        return
      }

      // Intentar hacer login con la contraseña actual para verificarla
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: passwords.currentPassword,
      })

      if (verifyError) {
        setError("La contraseña actual es incorrecta")
        return
      }

      // Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      })

      if (updateError) {
        console.error("Error updating password:", updateError)
        setError(updateError.message)
        return
      }

      setSuccess("¡Contraseña actualizada exitosamente!")
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      })
    } catch (error) {
      console.error("Unexpected error:", error)
      setError("Error inesperado. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setError(null)
    setSuccess(null)
  }

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="pb-6 border-b border-slate-200">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
          <Shield className="h-5 w-5 mr-3 text-blue-600" />
          Cambiar Contraseña
        </CardTitle>
        <CardDescription className="text-slate-600">
          Actualiza tu contraseña para mantener tu cuenta segura
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                placeholder="••••••••"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="pl-10 pr-10 border-slate-300 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                placeholder="••••••••"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="pl-10 border-slate-300 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showPasswords ? "text" : "password"}
                placeholder="••••••••"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="pl-10 border-slate-300 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Indicador de fortaleza */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Requisitos de seguridad:</p>
            <div className="grid grid-cols-1 gap-2">
              <div
                className={`flex items-center text-xs ${passwords.newPassword.length >= 6 ? "text-green-600" : "text-slate-400"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${passwords.newPassword.length >= 6 ? "bg-green-500" : "bg-slate-300"}`}
                ></div>
                Mínimo 6 caracteres
              </div>
              <div
                className={`flex items-center text-xs ${passwords.newPassword !== passwords.currentPassword && passwords.newPassword.length > 0 ? "text-green-600" : "text-slate-400"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${passwords.newPassword !== passwords.currentPassword && passwords.newPassword.length > 0 ? "bg-green-500" : "bg-slate-300"}`}
                ></div>
                Diferente a la contraseña actual
              </div>
              <div
                className={`flex items-center text-xs ${passwords.newPassword === passwords.confirmPassword && passwords.newPassword.length > 0 ? "text-green-600" : "text-slate-400"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${passwords.newPassword === passwords.confirmPassword && passwords.newPassword.length > 0 ? "bg-green-500" : "bg-slate-300"}`}
                ></div>
                Las contraseñas coinciden
              </div>
            </div>
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

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="w-full sm:w-auto border-slate-300 bg-transparent"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
