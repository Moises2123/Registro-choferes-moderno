import type { ChoferRegistro } from "./supabase"

type JsPDFConstructor = typeof import("jspdf").jsPDF

let jsPDFConstructor: JsPDFConstructor | null = null
let autoTableLoaded = false

/**
 * Carga jsPDF únicamente en el navegador.
 * Esto evita que Next.js/Turbopack intente procesar
 * la versión Node de jsPDF durante SSR.
 */
const loadPDFLibraries = async () => {
  if (typeof window === "undefined") {
    throw new Error("Las librerías PDF solo pueden cargarse en el navegador")
  }

  if (!jsPDFConstructor) {
    const jspdfModule = await import("jspdf")
    jsPDFConstructor = jspdfModule.jsPDF
  }

  if (!autoTableLoaded) {
    await import("jspdf-autotable")
    autoTableLoaded = true
  }

  return jsPDFConstructor
}

export const generatePDF = async (
  registros: ChoferRegistro[],
  title = "Registro de Choferes",
) => {
  try {
    console.log("🔄 Generando PDF con", registros.length, "registros...")

    if (typeof window === "undefined") {
      throw new Error("La generación del PDF debe ejecutarse en el navegador")
    }

    const jsPDF = await loadPDFLibraries()
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    if (typeof (doc as any).autoTable !== "function") {
      throw new Error("La función autoTable no está disponible")
    }

    doc.setFont("helvetica")

    // Título
    doc.setFontSize(18)
    doc.setTextColor(40, 40, 40)
    doc.text(title, 148.5, 15, { align: "center" })

    // Fecha
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)

    const fechaActual = new Date().toLocaleString("es-PE", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    doc.text(`Generado el: ${fechaActual}`, 148.5, 22, {
      align: "center",
    })

    // Datos
    const tableData = registros.map((registro, index) => {
      const fechaHora = new Date(registro.fecha_hora).toLocaleString("es-PE", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })

      return [
        index + 1,
        registro.nombre_chofer || "-",
        registro.tipo || "-",
        registro.destino || "-",
        registro.diligencia || "-",
        registro.sustento || "-",
        registro.solicitud || "-",
        registro.responsable || "-",
        fechaHora,
      ]
    })

    console.log("📊 Datos de tabla preparados:", tableData.length, "filas")

    ;(doc as any).autoTable({
      head: [[
        "#",
        "Chofer",
        "Tipo",
        "Destino",
        "Diligencia",
        "Sustento",
        "Solicitud",
        "Responsable",
        "Fecha y Hora",
      ]],

      body: tableData,

      startY: 28,

      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
        halign: "left",
        valign: "middle",
      },

      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        fontSize: 7,
      },

      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },

      columnStyles: {
        0: {
          halign: "center",
          cellWidth: 8,
        },
        1: {
          cellWidth: 28,
        },
        2: {
          halign: "center",
          cellWidth: 15,
        },
        3: {
          cellWidth: 24,
        },
        4: {
          cellWidth: 32,
        },
        5: {
          cellWidth: 32,
        },
        6: {
          cellWidth: 32,
        },
        7: {
          cellWidth: 28,
        },
        8: {
          cellWidth: 28,
        },
      },

      margin: {
        top: 28,
        left: 5,
        right: 5,
        bottom: 15,
      },

      didDrawPage: (data: any) => {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)

        doc.text(
          `Página ${data.pageNumber} - Sistema de Registro de Choferes`,
          148.5,
          200,
          {
            align: "center",
          },
        )
      },
    })

    console.log("✅ PDF generado exitosamente")

    return doc
  } catch (error) {
    console.error("❌ Error generando PDF:", error)

    const message =
      error instanceof Error ? error.message : String(error)

    throw new Error(`Error al generar PDF: ${message}`)
  }
}

export const downloadPDF = async (
  registros: ChoferRegistro[],
  filename?: string,
) => {
  try {
    console.log("⬇️ Iniciando descarga de PDF...")

    if (!registros || registros.length === 0) {
      throw new Error("No hay registros para descargar")
    }

    const doc = await generatePDF(registros)

    const defaultFilename = `registro-choferes-${
      new Date().toISOString().split("T")[0]
    }.pdf`

    const finalFilename = filename || defaultFilename

    console.log("📁 Descargando archivo:", finalFilename)

    doc.save(finalFilename)

    console.log("✅ Descarga iniciada exitosamente")

    return true
  } catch (error) {
    console.error("❌ Error en descarga:", error)
    throw error
  }
}

export const printPDF = async (registros: ChoferRegistro[]) => {
  try {
    console.log("🖨️ Iniciando impresión de PDF...")

    if (!registros || registros.length === 0) {
      throw new Error("No hay registros para imprimir")
    }

    const doc = await generatePDF(registros)

    const pdfBlob = doc.output("blob")
    const pdfUrl = URL.createObjectURL(pdfBlob)

    console.log("🔗 URL del PDF creada:", pdfUrl)

    const printWindow = window.open(pdfUrl, "_blank")

    if (!printWindow) {
      console.log("⚠️ No se pudo abrir ventana, intentando descarga...")

      const link = document.createElement("a")

      link.href = pdfUrl
      link.download = `registro-choferes-${
        new Date().toISOString().split("T")[0]
      }.pdf`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 1000)

      throw new Error(
        "No se pudo abrir la ventana de impresión. El archivo se descargó en su lugar.",
      )
    }

    printWindow.onload = () => {
      console.log("📄 Ventana cargada, iniciando impresión...")

      setTimeout(() => {
        printWindow.print()

        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl)
          printWindow.close()
        }, 1000)
      }, 500)
    }

    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.print()
      }
    }, 2000)

    console.log("✅ Impresión iniciada exitosamente")

    return true
  } catch (error) {
    console.error("❌ Error en impresión:", error)
    throw error
  }
}

export const checkPDFLibraries = async () => {
  try {
    if (typeof window === "undefined") {
      return false
    }

    const jsPDF = await loadPDFLibraries()
    const doc = new jsPDF()

    if (typeof (doc as any).autoTable !== "function") {
      throw new Error("jspdf-autotable no está disponible")
    }

    console.log("✅ Librerías PDF verificadas correctamente")

    return true
  } catch (error) {
    console.error("❌ Error verificando librerías PDF:", error)

    return false
  }
}

export const generateSimplePDF = async (
  registros: ChoferRegistro[],
) => {
  try {
    console.log("🔄 Generando PDF simple con todos los campos...")

    if (typeof window === "undefined") {
      throw new Error("La generación del PDF debe ejecutarse en el navegador")
    }

    const jsPDF = await loadPDFLibraries()
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("Registro de Choferes", 105, 20, {
      align: "center",
    })

    doc.setFontSize(10)

    const fecha = new Date().toLocaleString("es-PE", {
      timeZone: "America/Lima",
    })

    doc.text(`Generado: ${fecha}`, 105, 30, {
      align: "center",
    })

    let y = 50

    registros.forEach((registro, index) => {
      if (y > 260) {
        doc.addPage()
        y = 20
      }

      const fechaHora = new Date(
        registro.fecha_hora,
      ).toLocaleString("es-PE", {
        timeZone: "America/Lima",
      })

      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")

      doc.text(
        `${index + 1}. ${registro.nombre_chofer} - ${registro.tipo}`,
        10,
        y,
      )

      y += 6

      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")

      if (registro.destino) {
        doc.text(`Destino: ${registro.destino}`, 10, y)
        y += 4
      }

      if (registro.diligencia) {
        const lines = doc.splitTextToSize(
          `Diligencia: ${registro.diligencia}`,
          180,
        )

        doc.text(lines, 10, y)

        y += lines.length * 4
      }

      if (registro.sustento) {
        const lines = doc.splitTextToSize(
          `Sustento: ${registro.sustento}`,
          180,
        )

        doc.text(lines, 10, y)

        y += lines.length * 4
      }

      if (registro.solicitud) {
        const lines = doc.splitTextToSize(
          `Solicitud: ${registro.solicitud}`,
          180,
        )

        doc.text(lines, 10, y)

        y += lines.length * 4
      }

      if (registro.responsable) {
        doc.text(
          `Responsable: ${registro.responsable}`,
          10,
          y,
        )

        y += 4
      }

      doc.text(`Fecha: ${fechaHora}`, 10, y)

      y += 8
    })

    return doc
  } catch (error) {
    console.error("❌ Error generando PDF simple:", error)
    throw error
  }
}
