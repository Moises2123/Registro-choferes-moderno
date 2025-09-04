"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  MapPin,
  Download,
  Printer,
  AlertCircle,
  LogOut,
  Settings,
  Shield,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Building2,
  FileText,
  User,
  ArrowUpDown,
  Eye,
  TrendingUp,
  Activity,
} from "lucide-react"
import {
  supabase,
  type ChoferRegistro,
  type UserProfile,
  getPeruDateTime,
  getCurrentUser,
  getUserProfile,
  signOut,
  logActivity,
} from "@/lib/supabase"
import { downloadPDF, printPDF, checkPDFLibraries, generateSimplePDF } from "@/lib/pdf-utils"
import { ExportOptions } from "@/components/ui/export-options"
import { testSupabaseConnection, checkTableExists } from "@/lib/supabase-check"
import { LoginForm } from "@/components/auth/login-form"
import { UserManagement } from "@/components/admin/user-management"
import { ChangePassword } from "@/components/auth/change-password"

const CHOFERES = [
  "Morris Larrañaga Policarpio",
  "Saucedo Abad Florencio",
  "Rojas Gutierrez Hermes",
  "Paciffico Valles Publio Salvador",
  "Noronha Gomez Joao Andre",
  "Jhean Marco Guerra Vasquez",
  "Reategui Vasquez Javier",
  "Egberto Carlos Laiche Flores",
]

export default function ChoferRegistry() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [registros, setRegistros] = useState<ChoferRegistro[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<ChoferRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<ChoferRegistro | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [pdfLibrariesOk, setPdfLibrariesOk] = useState(false)
  const [activeTab, setActiveTab] = useState("nuevo")
  const [firstAdminInfo, setFirstAdminInfo] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nombre_chofer: "",
    tipo: "",
    destino: "",
    diligencia: "",
    sustento: "",
    solicitud: "",
    responsable: "",
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      initializeApp()
      getFirstAdminInfo()
    }
  }, [isAuthenticated])

  useEffect(() => {
    filterAndSortRegistros()
  }, [registros, searchTerm, filterType, sortOrder])

  const filterAndSortRegistros = () => {
    const filtered = registros.filter((registro) => {
      const matchesSearch =
        registro.nombre_chofer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registro.destino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registro.diligencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registro.responsable?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterType === "all" || registro.tipo.toLowerCase() === filterType.toLowerCase()

      return matchesSearch && matchesFilter
    })

    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_hora).getTime()
      const dateB = new Date(b.fecha_hora).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })

    setFilteredRegistros(filtered)
  }

  const getFirstAdminInfo = async () => {
    try {
      const { data, error } = await supabase.rpc("get_first_admin_info")
      if (!error && data && data.length > 0) {
        setFirstAdminInfo(data[0])
      }
    } catch (error) {
      console.error("Error getting first admin info:", error)
    }
  }

  const checkAuthStatus = async () => {
    try {
      const { user, error } = await getCurrentUser()

      if (error || !user) {
        setIsAuthenticated(false)
        setAuthLoading(false)
        return
      }

      const { data: profile } = await getUserProfile(user.id)

      setUser(user)
      setUserProfile(profile)
      setIsAuthenticated(true)

      // Log de inicio de sesión - CORREGIDO con mejor manejo de errores
      try {
        const logResult = await logActivity("LOGIN", "auth", null, null, { email: user.email })
        if (logResult.error) {
          console.warn("Could not log login activity:", logResult.error.message)
        }
      } catch (logError) {
        console.warn("Could not log login activity:", logError)
        // No bloquear el login si falla el log
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      setIsAuthenticated(false)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      // Log de cierre de sesión - CORREGIDO
      try {
        const logResult = await logActivity("LOGOUT", "auth", null, null, { email: user?.email })
        if (logResult.error) {
          console.warn("Could not log logout activity:", logResult.error.message)
        }
      } catch (logError) {
        console.warn("Could not log logout activity:", logError)
        // Continuar con el logout aunque falle el log
      }

      await signOut()
      setUser(null)
      setUserProfile(null)
      setIsAuthenticated(false)
      setRegistros([])
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      })
    }
  }

  const initializeApp = async () => {
    try {
      console.log("🚀 Inicializando aplicación...")

      const pdfOk = await checkPDFLibraries()
      setPdfLibrariesOk(pdfOk)
      if (!pdfOk) {
        console.warn("⚠️ Librerías PDF avanzadas no disponibles, usando modo simple")
      }

      const connectionOk = await testSupabaseConnection()
      if (!connectionOk) {
        setConnectionError("No se pudo conectar a Supabase. Verifica las variables de entorno.")
        setLoading(false)
        return
      }

      const tableExists = await checkTableExists()
      if (!tableExists) {
        setConnectionError("La tabla 'chofer_registros' no existe. Ejecuta el script SQL en Supabase.")
        setLoading(false)
        return
      }

      await fetchRegistros()
    } catch (error) {
      console.error("❌ Error inicializando app:", error)
      setConnectionError("Error inesperado al inicializar la aplicación.")
      setLoading(false)
    }
  }

  const fetchRegistros = async () => {
    try {
      console.log("📥 Cargando registros...")

      const { data, error } = await supabase
        .from("chofer_registros")
        .select("*")
        .order("fecha_hora", { ascending: false })

      if (error) {
        console.error("❌ Error cargando registros:", error)
        throw error
      }

      console.log("✅ Registros cargados:", data?.length || 0)
      setRegistros(data || [])
      setConnectionError(null)
    } catch (error) {
      console.error("❌ Error en fetchRegistros:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar los registros: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre_chofer || !formData.tipo) {
      toast({
        title: "Error",
        description: "Por favor complete los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("💾 Guardando registro...")
      const peruTime = getPeruDateTime()

      if (editingRegistro) {
        const { error } = await supabase
          .from("chofer_registros")
          .update({
            nombre_chofer: formData.nombre_chofer,
            tipo: formData.tipo,
            destino: formData.destino || null,
            diligencia: formData.diligencia || null,
            sustento: formData.sustento || null,
            solicitud: formData.solicitud || null,
            responsable: formData.responsable || null,
            updated_at: peruTime.toISOString(),
          })
          .eq("id", editingRegistro.id)

        if (error) {
          console.error("❌ Error actualizando:", error)
          throw error
        }

        // Log de actualización - CORREGIDO
        try {
          const logResult = await logActivity(
            "UPDATE",
            "chofer_registros",
            editingRegistro.id,
            editingRegistro,
            formData,
          )
          if (logResult.error) {
            console.warn("Could not log update activity:", logResult.error.message)
          }
        } catch (logError) {
          console.warn("Could not log update activity:", logError)
        }

        console.log("✅ Registro actualizado")
        toast({
          title: "¡Éxito!",
          description: "Registro actualizado correctamente",
        })
      } else {
        const { data, error } = await supabase
          .from("chofer_registros")
          .insert([
            {
              nombre_chofer: formData.nombre_chofer,
              tipo: formData.tipo,
              destino: formData.destino || null,
              diligencia: formData.diligencia || null,
              sustento: formData.sustento || null,
              solicitud: formData.solicitud || null,
              responsable: formData.responsable || null,
              fecha_hora: peruTime.toISOString(),
            },
          ])
          .select()

        if (error) {
          console.error("❌ Error insertando:", error)
          throw error
        }

        // Log de inserción - CORREGIDO
        try {
          const logResult = await logActivity("INSERT", "chofer_registros", data[0]?.id, null, formData)
          if (logResult.error) {
            console.warn("Could not log insert activity:", logResult.error.message)
          }
        } catch (logError) {
          console.warn("Could not log insert activity:", logError)
        }

        console.log("✅ Registro creado:", data)
        toast({
          title: "¡Éxito!",
          description: "Registro creado correctamente",
        })
      }

      resetForm()
      fetchRegistros()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("❌ Error en handleSubmit:", error)
      toast({
        title: "Error",
        description: `No se pudo guardar el registro: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (registro: ChoferRegistro) => {
    setEditingRegistro(registro)
    setFormData({
      nombre_chofer: registro.nombre_chofer,
      tipo: registro.tipo,
      destino: registro.destino || "",
      diligencia: registro.diligencia || "",
      sustento: registro.sustento || "",
      solicitud: registro.solicitud || "",
      responsable: registro.responsable || "",
    })
    setActiveTab("nuevo") // Cambiar a la pestaña de nuevo registro
  }

  const handleDelete = async (id: number) => {
    try {
      const registro = registros.find((r) => r.id === id)
      const { error } = await supabase.from("chofer_registros").delete().eq("id", id)

      if (error) throw error

      // Log de eliminación - CORREGIDO
      try {
        const logResult = await logActivity("DELETE", "chofer_registros", id, registro, null)
        if (logResult.error) {
          console.warn("Could not log delete activity:", logResult.error.message)
        }
      } catch (logError) {
        console.warn("Could not log delete activity:", logError)
      }

      toast({
        title: "¡Eliminado!",
        description: "Registro eliminado correctamente",
      })
      fetchRegistros()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nombre_chofer: "",
      tipo: "",
      destino: "",
      diligencia: "",
      sustento: "",
      solicitud: "",
      responsable: "",
    })
    setEditingRegistro(null)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("es-PE", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDownloadPDF = async () => {
    try {
      if (registros.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay registros para descargar",
          variant: "destructive",
        })
        return
      }

      console.log("🔄 Iniciando descarga de PDF...")

      try {
        await downloadPDF(registros, `registro-choferes-${new Date().toISOString().split("T")[0]}.pdf`)
      } catch (error) {
        console.log("🔄 Usando PDF simple como fallback...")
        const doc = await generateSimplePDF(registros)
        doc.save(`registro-choferes-simple-${new Date().toISOString().split("T")[0]}.pdf`)
      }

      // Log de exportación - CORREGIDO
      try {
        const logResult = await logActivity("EXPORT_PDF", "chofer_registros", null, null, { count: registros.length })
        if (logResult.error) {
          console.warn("Could not log export activity:", logResult.error.message)
        }
      } catch (logError) {
        console.warn("Could not log export activity:", logError)
      }

      toast({
        title: "¡Descarga exitosa!",
        description: "El archivo PDF se ha descargado correctamente",
      })
    } catch (error) {
      console.error("❌ Error en descarga:", error)
      toast({
        title: "Error en descarga",
        description: error.message || "No se pudo descargar el PDF",
        variant: "destructive",
      })
    }
  }

  const handlePrint = async () => {
    try {
      if (registros.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay registros para imprimir",
          variant: "destructive",
        })
        return
      }

      console.log("🔄 Iniciando impresión...")

      try {
        await printPDF(registros)
      } catch (error) {
        console.log("🔄 Usando impresión simple como fallback...")
        const doc = await generateSimplePDF(registros)
        const pdfBlob = doc.output("blob")
        const pdfUrl = URL.createObjectURL(pdfBlob)
        const printWindow = window.open(pdfUrl, "_blank")
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 500)
          }
        }
      }

      // Log de impresión - CORREGIDO
      try {
        const logResult = await logActivity("PRINT_PDF", "chofer_registros", null, null, { count: registros.length })
        if (logResult.error) {
          console.warn("Could not log print activity:", logResult.error.message)
        }
      } catch (logError) {
        console.warn("Could not log print activity:", logError)
      }

      toast({
        title: "¡Impresión iniciada!",
        description: "Se ha abierto la ventana de impresión",
      })
    } catch (error) {
      console.error("❌ Error en impresión:", error)
      toast({
        title: "Error en impresión",
        description: error.message || "No se pudo imprimir el PDF",
        variant: "destructive",
      })
    }
  }

  // Calcular estadísticas
  const todayEntries = registros.filter(
    (r) => r.tipo === "Entrada" && new Date(r.fecha_hora).toDateString() === new Date().toDateString(),
  ).length

  const todayExits = registros.filter(
    (r) => r.tipo === "Salida" && new Date(r.fecha_hora).toDateString() === new Date().toDateString(),
  ).length

  const activeDrivers = new Set(
    registros
      .filter((r) => new Date(r.fecha_hora).toDateString() === new Date().toDateString())
      .map((r) => r.nombre_chofer),
  ).size

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg font-medium">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm onSuccess={checkAuthStatus} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg font-medium">Cargando sistema...</p>
        </div>
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">Error de Conexión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-600 text-center">{connectionError}</p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <p className="font-semibold text-slate-800">Para solucionarlo:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                <li>Ve a tu proyecto en Supabase</li>
                <li>Abre el "SQL Editor"</li>
                <li>Ejecuta el script de creación de tabla</li>
                <li>Verifica las variables de entorno</li>
              </ol>
            </div>
            <Button onClick={initializeApp} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
              Reintentar Conexión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header moderno */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Sistema de Registro</h1>
                <p className="text-slate-600 text-sm">Control de choferes • Iquitos, Perú</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {userProfile?.role === "admin" && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  <span className="text-sm font-medium text-slate-700">{userProfile?.full_name || user?.email}</span>
                </div>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="border-slate-300 bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Tabs modernos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-white shadow-sm border border-slate-200">
            <TabsTrigger value="nuevo" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Registro
            </TabsTrigger>
            <TabsTrigger value="historial" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
            {userProfile?.role === "admin" && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="nuevo" className="space-y-8">
            {/* Estadísticas modernas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Total Registros</p>
                      <p className="text-3xl font-bold text-slate-900">{registros.length}</p>
                      <p className="text-xs text-slate-500 mt-1">Histórico completo</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Entradas Hoy</p>
                      <p className="text-3xl font-bold text-emerald-600">{todayEntries}</p>
                      <p className="text-xs text-slate-500 mt-1">Ingresos del día</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Salidas Hoy</p>
                      <p className="text-3xl font-bold text-red-500">{todayExits}</p>
                      <p className="text-xs text-slate-500 mt-1">Salidas del día</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl">
                      <Activity className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Choferes Activos</p>
                      <p className="text-3xl font-bold text-purple-600">{activeDrivers}</p>
                      <p className="text-xs text-slate-500 mt-1">Únicos hoy</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Formulario de nuevo registro */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="pb-6 border-b border-slate-200">
                <CardTitle className="text-2xl font-bold text-slate-900 flex items-center">
                  <Plus className="h-6 w-6 mr-3 text-blue-600" />
                  {editingRegistro ? "Editar Registro" : "Crear Nuevo Registro"}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Complete la información del registro. Los campos marcados con * son obligatorios.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Información principal */}
                  <div className="bg-slate-50 rounded-lg p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Información Principal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nombre_chofer" className="text-sm font-medium text-slate-700">
                          Nombre del Chofer *
                        </Label>
                        <Select
                          value={formData.nombre_chofer}
                          onValueChange={(value) => setFormData({ ...formData, nombre_chofer: value })}
                        >
                          <SelectTrigger className="border-slate-300 focus:border-blue-500 h-12">
                            <User className="h-4 w-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Seleccionar chofer" />
                          </SelectTrigger>
                          <SelectContent>
                            {CHOFERES.map((chofer) => (
                              <SelectItem key={chofer} value={chofer}>
                                {chofer}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tipo" className="text-sm font-medium text-slate-700">
                          Tipo de Registro *
                        </Label>
                        <Select
                          value={formData.tipo}
                          onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                        >
                          <SelectTrigger className="border-slate-300 focus:border-blue-500 h-12">
                            <Activity className="h-4 w-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entrada">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                                Entrada
                              </div>
                            </SelectItem>
                            <SelectItem value="Salida">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                                Salida
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="destino" className="text-sm font-medium text-slate-700">
                          Destino
                        </Label>
                        <Input
                          id="destino"
                          value={formData.destino}
                          onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                          placeholder="Ingrese el destino"
                          className="border-slate-300 focus:border-blue-500 h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="responsable" className="text-sm font-medium text-slate-700">
                          Responsable
                        </Label>
                        <Input
                          id="responsable"
                          value={formData.responsable}
                          onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                          placeholder="Nombre del responsable"
                          className="border-slate-300 focus:border-blue-500 h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detalles adicionales */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-600" />
                      Detalles Adicionales
                    </h3>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="diligencia" className="text-sm font-medium text-slate-700">
                          Diligencia
                        </Label>
                        <Textarea
                          id="diligencia"
                          value={formData.diligencia}
                          onChange={(e) => setFormData({ ...formData, diligencia: e.target.value })}
                          placeholder="Descripción detallada de la diligencia a realizar"
                          rows={4}
                          className="border-slate-300 focus:border-blue-500 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sustento" className="text-sm font-medium text-slate-700">
                          Sustento
                        </Label>
                        <Textarea
                          id="sustento"
                          value={formData.sustento}
                          onChange={(e) => setFormData({ ...formData, sustento: e.target.value })}
                          placeholder="Justificación o sustento del registro"
                          rows={4}
                          className="border-slate-300 focus:border-blue-500 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="solicitud" className="text-sm font-medium text-slate-700">
                          Solicitud
                        </Label>
                        <Textarea
                          id="solicitud"
                          value={formData.solicitud}
                          onChange={(e) => setFormData({ ...formData, solicitud: e.target.value })}
                          placeholder="Detalles de la solicitud o autorización"
                          rows={4}
                          className="border-slate-300 focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="w-full sm:w-auto border-slate-300 h-12 bg-transparent"
                    >
                      Limpiar Formulario
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 px-8"
                    >
                      {editingRegistro ? "Actualizar" : "Guardar"} Registro
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="space-y-8">
            {/* Barra de acciones para historial */}
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Búsqueda y filtros */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1 max-w-2xl">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Buscar por chofer, destino, diligencia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full sm:w-40 border-slate-300">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="entrada">Entradas</SelectItem>
                        <SelectItem value="salida">Salidas</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {sortOrder === "desc" ? "Más reciente" : "Más antiguo"}
                    </Button>
                  </div>

                  {/* Botones de exportación */}
                  <div className="flex flex-wrap gap-3">
                    <ExportOptions registros={registros} onToast={toast} />

                    <Button
                      onClick={handleDownloadPDF}
                      variant="outline"
                      className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      disabled={registros.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>

                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                      disabled={registros.length === 0}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de historial */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Historial de Registros</CardTitle>
                    <CardDescription className="text-slate-600">
                      {filteredRegistros.length} de {registros.length} registros
                      {searchTerm && ` • Filtrado por: "${searchTerm}"`}
                    </CardDescription>
                  </div>
                  {!pdfLibrariesOk && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Modo PDF Simple
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredRegistros.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-lg font-medium mb-2">
                      {searchTerm || filterType !== "all"
                        ? "No se encontraron registros"
                        : "No hay registros disponibles"}
                    </p>
                    <p className="text-slate-400">
                      {searchTerm || filterType !== "all"
                        ? "Intenta ajustar los filtros de búsqueda"
                        : "Crea el primer registro en la pestaña 'Nuevo Registro'"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="font-semibold text-slate-700">Chofer</TableHead>
                          <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                          <TableHead className="font-semibold text-slate-700">Destino</TableHead>
                          <TableHead className="font-semibold text-slate-700">Diligencia</TableHead>
                          <TableHead className="font-semibold text-slate-700">Sustento</TableHead>
                          <TableHead className="font-semibold text-slate-700">Solicitud</TableHead>
                          <TableHead className="font-semibold text-slate-700">Responsable</TableHead>
                          <TableHead className="font-semibold text-slate-700">Fecha y Hora</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegistros.map((registro, index) => (
                          <TableRow
                            key={registro.id}
                            className="hover:bg-slate-50 transition-colors duration-150 border-b border-slate-100"
                          >
                            <TableCell className="font-medium text-slate-900">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-slate-600" />
                                </div>
                                <span>{registro.nombre_chofer}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  registro.tipo === "Entrada"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                }
                              >
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${
                                    registro.tipo === "Entrada" ? "bg-emerald-500" : "bg-red-500"
                                  }`}
                                ></div>
                                {registro.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {registro.destino ? (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-3 w-3 text-slate-400" />
                                  <span className="max-w-32 truncate">{registro.destino}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {registro.diligencia ? (
                                <span className="max-w-40 truncate block" title={registro.diligencia}>
                                  {registro.diligencia}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {registro.sustento ? (
                                <span className="max-w-40 truncate block" title={registro.sustento}>
                                  {registro.sustento}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {registro.solicitud ? (
                                <span className="max-w-40 truncate block" title={registro.solicitud}>
                                  {registro.solicitud}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {registro.responsable || <span className="text-slate-400">-</span>}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span>{formatDateTime(registro.fecha_hora)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEdit(registro)} className="cursor-pointer">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar registro
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `${registro.nombre_chofer} - ${registro.tipo} - ${formatDateTime(registro.fecha_hora)}`,
                                      )
                                      toast({
                                        title: "Copiado",
                                        description: "Información copiada al portapapeles",
                                      })
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Copiar info
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción no se puede deshacer. El registro de{" "}
                                          <strong>{registro.nombre_chofer}</strong> será eliminado permanentemente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(registro.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {userProfile?.role === "admin" && (
            <TabsContent value="admin" className="space-y-6">
              <UserManagement />
              <ChangePassword />
            </TabsContent>
          )}
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
