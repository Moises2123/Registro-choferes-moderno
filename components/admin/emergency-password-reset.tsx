"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Key, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function EmergencyPasswordReset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [email, setEmail] = useState("")

  const handleEmergencyReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Enviar email de recuperación
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(`Error: ${error.message}`)
        return
      }

      setSuccess(`✅ Enlace de recuperación enviado a ${email}`)
      setEmail("")
    } catch (error) {
      setError("Error inesperado al enviar el enlace de recuperación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg">Recuperación de Emergencia</CardTitle>
        </div>
        <CardDescription>
          Si olvidaste tu contraseña de administrador, usa esta opción para recibir un enlace de recuperación.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleEmergencyReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email del Administrador</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Key className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Solo para emergencias:</strong>
            </p>
            <ul className="text-xs text-orange-700 mt-1 space-y-1">
              <li>• Usa solo si no puedes acceder como administrador</li>
              <li>• Revisa tu email y carpeta de spam</li>
              <li>• El enlace expira en 1 hora</li>
            </ul>
          </div>

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Alternativa:</strong> Si tienes acceso a Supabase Dashboard, puedes ejecutar el script SQL{" "}
            <code className="bg-gray-200 px-1 rounded">reset-admin-password.sql</code> para resetear manualmente la
            contraseña.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
