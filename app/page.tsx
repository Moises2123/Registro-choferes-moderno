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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Plus, Edit, Trash2, Users, Clock, MapPin } from "lucide-react"
import { supabase, type ChoferRegistro } from "@/lib/supabase"

const CHOFERES = [
  "Morris Larrañaga Policarpio",
  "Saucedo Abad Florencio",
  "Rojas Gutierrez Hermes",
  "Paciffico Valles Publio Salvador",
  "Noronha Gomez Joao Andre",
  "Jhean Marco Guerra Vasquez",
  "Reategui Vasquez Javier",
]

export default function ChoferRegistry() {
  const [registros, setRegistros] = useState<ChoferRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<ChoferRegistro | null>(null)
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
    fetchRegistros()
  }, [])

  const fetchRegistros = async () => {
    try {
      const { data, error } = await supabase
        .from("chofer_registros")
        .select("*")
        .order("fecha_hora", { ascending: false })

      if (error) throw error
      setRegistros(data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros",
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
      const now = new Date()
      const peruTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }))

      if (editingRegistro) {
        const { error } = await supabase
          .from("chofer_registros")
          .update({
            ...formData,
            updated_at: peruTime.toISOString(),
          })
          .eq("id", editingRegistro.id)

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Registro actualizado correctamente",
        })
      } else {
        const { error } = await supabase.from("chofer_registros").insert([
          {
            ...formData,
            fecha_hora: peruTime.toISOString(),
          },
        ])

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Registro creado correctamente",
        })
      }

      resetForm()
      fetchRegistros()
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el registro",
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
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("chofer_registros").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Éxito",
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
      second: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando registros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema de Registro de Choferes</h1>
          <p className="text-gray-600 text-lg">Control de entradas y salidas - Zona horaria: Lima, Perú</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Registros</p>
                  <p className="text-3xl font-bold text-blue-600">{registros.length}</p>
                </div>
                <Users className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entradas Hoy</p>
                  <p className="text-3xl font-bold text-green-600">
                    {
                      registros.filter(
                        (r) =>
                          r.tipo === "Entrada" && new Date(r.fecha_hora).toDateString() === new Date().toDateString(),
                      ).length
                    }
                  </p>
                </div>
                <MapPin className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Salidas Hoy</p>
                  <p className="text-3xl font-bold text-red-600">
                    {
                      registros.filter(
                        (r) =>
                          r.tipo === "Salida" && new Date(r.fecha_hora).toDateString() === new Date().toDateString(),
                      ).length
                    }
                  </p>
                </div>
                <Clock className="h-12 w-12 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Record Button */}
        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRegistro ? "Editar Registro" : "Nuevo Registro de Chofer"}</DialogTitle>
                <DialogDescription>
                  Complete la información del registro. Los campos marcados con * son obligatorios.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_chofer">Nombre del Chofer *</Label>
                    <Select
                      value={formData.nombre_chofer}
                      onValueChange={(value) => setFormData({ ...formData, nombre_chofer: value })}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Salida">Salida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destino">Destino</Label>
                    <Input
                      id="destino"
                      value={formData.destino}
                      onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                      placeholder="Ingrese el destino"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input
                      id="responsable"
                      value={formData.responsable}
                      onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                      placeholder="Nombre del responsable"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diligencia">Diligencia</Label>
                  <Textarea
                    id="diligencia"
                    value={formData.diligencia}
                    onChange={(e) => setFormData({ ...formData, diligencia: e.target.value })}
                    placeholder="Descripción de la diligencia"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sustento">Sustento</Label>
                  <Textarea
                    id="sustento"
                    value={formData.sustento}
                    onChange={(e) => setFormData({ ...formData, sustento: e.target.value })}
                    placeholder="Sustento del registro"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solicitud">Solicitud</Label>
                  <Textarea
                    id="solicitud"
                    value={formData.solicitud}
                    onChange={(e) => setFormData({ ...formData, solicitud: e.target.value })}
                    placeholder="Detalles de la solicitud"
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingRegistro ? "Actualizar" : "Guardar"} Registro
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Records Table */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Historial de Registros</CardTitle>
            <CardDescription>Todos los registros de entrada y salida de choferes</CardDescription>
          </CardHeader>
          <CardContent>
            {registros.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No hay registros disponibles</p>
                <p className="text-gray-400">Agregue el primer registro para comenzar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chofer</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Diligencia</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((registro) => (
                      <TableRow key={registro.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{registro.nombre_chofer}</TableCell>
                        <TableCell>
                          <Badge
                            variant={registro.tipo === "Entrada" ? "default" : "secondary"}
                            className={
                              registro.tipo === "Entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }
                          >
                            {registro.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{registro.destino || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">{registro.diligencia || "-"}</TableCell>
                        <TableCell>{registro.responsable || "-"}</TableCell>
                        <TableCell className="text-sm">{formatDateTime(registro.fecha_hora)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(registro)}
                              className="hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:bg-red-50 text-red-600 bg-transparent"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El registro será eliminado permanentemente.
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
