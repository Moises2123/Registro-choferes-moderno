"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { signIn, signUp, supabase } from "@/lib/supabase"

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
  })
  const [recoveryEmail, setRecoveryEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isLogin) {
        // Iniciar sesión
        const { data, error } = await signIn(formData.email, formData.password)

        if (error) {
          setError(error.message)
          return
        }

        if (data.user) {
          setSuccess("¡Inicio de sesión exitoso!")
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } else {
        // Registrarse
        if (formData.password !== formData.confirmPassword) {
          setError("Las contraseñas no coinciden")
          return
        }

        if (formData.password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres")
          return
        }

        const { data, error } = await signUp(formData.email, formData.password, formData.fullName)

        if (error) {
          setError(error.message)
          return
        }

        if (data.user) {
          setSuccess("¡Registro exitoso! Revisa tu email para confirmar tu cuenta.")
          setIsLogin(true)
          setFormData({ email: "", password: "", fullName: "", confirmPassword: "" })
        }
      }
    } catch (error) {
      setError("Error inesperado. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess("Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.")
      setRecoveryEmail("")
      setTimeout(() => {
        setIsRecoveryMode(false)
        setSuccess(null)
      }, 3000)
    } catch (error) {
      setError("Error inesperado. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ email: "", password: "", fullName: "", confirmPassword: "" })
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRecoveryMode ? "Recuperar Contraseña" : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </CardTitle>
          <CardDescription>
            {isRecoveryMode
              ? "Ingresa tu email para recibir un enlace de recuperación"
              : isLogin
                ? "Ingresa tus credenciales para acceder al sistema"
                : "Crea una nueva cuenta para acceder al sistema"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isRecoveryMode ? (
            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(false)
                    setRecoveryEmail("")
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Procesando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </Button>

              {isLogin && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryMode(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </form>
          )}

          {!isRecoveryMode && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  resetForm()
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {isLogin ? "¿No tienes cuenta? Crear una nueva" : "¿Ya tienes cuenta? Iniciar sesión"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
