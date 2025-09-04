"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, UserPlus } from "lucide-react"
import { signUp, supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function CreateSpecificAdmin() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const createSpecificAdmin = async () => {
    setLoading(true)
    try {
      // Crear el usuario con credenciales específicas
      const { data, error } = await signUp("timberling45@gmail.com", "123$123", "Administrador Principal")

      if (error) {
        throw error
      }

      if (data.user) {
        // Forzar que sea admin
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ role: "admin" })
          .eq("id", data.user.id)

        if (updateError) throw updateError

        setSuccess(true)
        toast({
          title: "Administrador creado",
          description: "Usuario timberling45@gmail.com configurado como administrador",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el administrador",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-green-800">
            <Shield className="h-5 w-5" />
            <div>
              <p className="font-semibold">¡Administrador creado exitosamente!</p>
              <p className="text-sm">
                Email: timberling45@gmail.com
                <br />
                Contraseña: 123$123
                <br />
                Rol: Administrador
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Crear Administrador Específico
        </CardTitle>
        <CardDescription>Crear usuario timberling45@gmail.com como administrador principal</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            <strong>Credenciales que se crearán:</strong>
            <br />
            Email: timberling45@gmail.com
            <br />
            Contraseña: 123$123
            <br />
            Rol: Administrador
          </AlertDescription>
        </Alert>

        <Button onClick={createSpecificAdmin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? "Creando..." : "Crear Administrador"}
        </Button>
      </CardContent>
    </Card>
  )
}
