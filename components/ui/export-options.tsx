"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileText, Filter } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { ChoferRegistro } from "@/lib/supabase"
import { downloadPDF, printPDF, generateSimplePDF } from "@/lib/pdf-utils"

interface ExportOptionsProps {
  registros: ChoferRegistro[]
  onToast: (toast: { title: string; description: string; variant?: "destructive" }) => void
}

export function ExportOptions({ registros, onToast }: ExportOptionsProps) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedChofer, setSelectedChofer] = useState("")
  const [selectedTipo, setSelectedTipo] = useState("")

  const choferes = Array.from(new Set(registros.map((r) => r.nombre_chofer)))

  const getFilteredRegistros = () => {
    return registros.filter((registro) => {
      const registroDate = new Date(registro.fecha_hora)

      // Filtro por fecha
      if (dateFrom && registroDate < dateFrom) return false
      if (dateTo && registroDate > dateTo) return false

      // Filtro por chofer
      if (selectedChofer && registro.nombre_chofer !== selectedChofer) return false

      // Filtro por tipo
      if (selectedTipo && registro.tipo !== selectedTipo) return false

      return true
    })
  }

  const handleExportFiltered = async (action: "download" | "print") => {
    try {
      const filteredRegistros = getFilteredRegistros()

      if (filteredRegistros.length === 0) {
        onToast({
          title: "Sin resultados",
          description: "No hay registros que coincidan con los filtros aplicados",
          variant: "destructive",
        })
        return
      }

      let title = "Registro de Choferes"
      if (dateFrom || dateTo || selectedChofer || selectedTipo) {
        title += " (Filtrado)"
      }

      if (action === "download") {
        try {
          await downloadPDF(
            filteredRegistros,
            `registro-choferes-filtrado-${new Date().toISOString().split("T")[0]}.pdf`,
          )
        } catch (error) {
          // Fallback a PDF simple
          console.log("🔄 Intentando con PDF simple...")
          const doc = await generateSimplePDF(filteredRegistros)
          doc.save(`registro-choferes-simple-${new Date().toISOString().split("T")[0]}.pdf`)
        }

        onToast({
          title: "Descarga exitosa",
          description: `Se descargaron ${filteredRegistros.length} registros`,
        })
      } else {
        try {
          await printPDF(filteredRegistros)
        } catch (error) {
          // Fallback a PDF simple
          console.log("🔄 Intentando impresión simple...")
          const doc = await generateSimplePDF(filteredRegistros)
          const pdfBlob = doc.output("blob")
          const pdfUrl = URL.createObjectURL(pdfBlob)
          const printWindow = window.open(pdfUrl, "_blank")
          if (printWindow) {
            printWindow.onload = () => printWindow.print()
          }
        }

        onToast({
          title: "Impresión iniciada",
          description: `Se imprimirán ${filteredRegistros.length} registros`,
        })
      }

      setIsFilterDialogOpen(false)
    } catch (error) {
      console.error("❌ Error en exportación:", error)
      onToast({
        title: "Error",
        description: error.message || "Error al exportar registros",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    setSelectedChofer("")
    setSelectedTipo("")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600">
            <FileText className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Opciones de Exportación</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsFilterDialogOpen(true)}>
            <Filter className="mr-2 h-4 w-4" />
            Exportar con Filtros
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Registros Filtrados</DialogTitle>
            <DialogDescription>Aplica filtros para exportar registros específicos</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filtro por fecha */}
            <div className="space-y-2">
              <Label>Rango de Fechas</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("flex-1 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: es }) : "Desde"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("flex-1 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: es }) : "Hasta"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Filtro por chofer */}
            <div className="space-y-2">
              <Label htmlFor="chofer-filter">Chofer</Label>
              <select
                id="chofer-filter"
                value={selectedChofer}
                onChange={(e) => setSelectedChofer(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Todos los choferes</option>
                {choferes.map((chofer) => (
                  <option key={chofer} value={chofer}>
                    {chofer}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo-filter">Tipo</Label>
              <select
                id="tipo-filter"
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Entrada y Salida</option>
                <option value="Entrada">Solo Entradas</option>
                <option value="Salida">Solo Salidas</option>
              </select>
            </div>

            {/* Mostrar cantidad de registros filtrados */}
            <div className="text-sm text-muted-foreground">Registros encontrados: {getFilteredRegistros().length}</div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportFiltered("print")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Imprimir
            </Button>
            <Button onClick={() => handleExportFiltered("download")} className="bg-green-600 hover:bg-green-700">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
