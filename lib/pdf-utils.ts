import jsPDF from "jspdf"
import "jspdf-autotable"
import type { ChoferRegistro } from "./supabase"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export const generatePDF = (registros: ChoferRegistro[], title = "Registro de Choferes") => {
  const doc = new jsPDF()

  // Configurar fuente
  doc.setFont("helvetica")

  // Título
  doc.setFontSize(18)
  doc.setTextColor(40, 40, 40)
  doc.text(title, 105, 20, { align: "center" })

  // Subtítulo con fecha
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  const fechaActual = new Date().toLocaleString("es-PE", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  doc.text(`Generado el: ${fechaActual}`, 105, 30, { align: "center" })

  // Preparar datos para la tabla
  const tableData = registros.map((registro, index) => [
    index + 1,
    registro.nombre_chofer,
    registro.tipo,
    registro.destino || "-",
    registro.diligencia || "-",
    registro.responsable || "-",
    new Date(registro.fecha_hora).toLocaleString("es-PE", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  ])

  // Configurar tabla
  doc.autoTable({
    head: [["#", "Chofer", "Tipo", "Destino", "Diligencia", "Responsable", "Fecha y Hora"]],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Azul
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Gris claro
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { cellWidth: 40 },
      2: { halign: "center", cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
      5: { cellWidth: 30 },
      6: { cellWidth: 25 },
    },
    margin: { top: 40, left: 10, right: 10 },
    didDrawPage: (data) => {
      // Pie de página
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Página ${data.pageNumber} - Sistema de Registro de Choferes`, 105, doc.internal.pageSize.height - 10, {
        align: "center",
      })
    },
  })

  return doc
}

export const downloadPDF = (registros: ChoferRegistro[], filename?: string) => {
  const doc = generatePDF(registros)
  const defaultFilename = `registro-choferes-${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(filename || defaultFilename)
}

export const printPDF = (registros: ChoferRegistro[]) => {
  const doc = generatePDF(registros)
  const pdfBlob = doc.output("blob")
  const pdfUrl = URL.createObjectURL(pdfBlob)

  const printWindow = window.open(pdfUrl)
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print()
      // Limpiar URL después de un tiempo
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 1000)
    }
  }
}
