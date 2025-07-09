import type { ChoferRegistro } from "./supabase"

// Función para cargar las librerías dinámicamente
const loadPDFLibraries = async () => {
  try {
    // Importación dinámica para evitar problemas con SSR
    const jsPDF = (await import("jspdf")).default
    await import("jspdf-autotable")

    return jsPDF
  } catch (error) {
    console.error("❌ Error cargando librerías PDF:", error)
    throw new Error("No se pudieron cargar las librerías PDF")
  }
}

export const generatePDF = async (registros: ChoferRegistro[], title = "Registro de Choferes") => {
  try {
    console.log("🔄 Generando PDF con", registros.length, "registros...")

    // Cargar librerías dinámicamente
    const jsPDF = await loadPDFLibraries()
    const doc = new jsPDF()

    // Verificar que autoTable esté disponible
    if (typeof doc.autoTable !== "function") {
      throw new Error("La función autoTable no está disponible")
    }

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
        registro.responsable || "-",
        fechaHora,
      ]
    })

    console.log("📊 Datos de tabla preparados:", tableData.length, "filas")

    // Configurar tabla
    doc.autoTable({
      head: [["#", "Chofer", "Tipo", "Destino", "Diligencia", "Responsable", "Fecha y Hora"]],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        halign: "left",
      },
      headStyles: {
        fillColor: [59, 130, 246], // Azul
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
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
        doc.text(
          `Página ${data.pageNumber} - Sistema de Registro de Choferes`,
          105,
          doc.internal.pageSize.height - 10,
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
    throw new Error(`Error al generar PDF: ${error.message}`)
  }
}

export const downloadPDF = async (registros: ChoferRegistro[], filename?: string) => {
  try {
    console.log("⬇️ Iniciando descarga de PDF...")

    if (!registros || registros.length === 0) {
      throw new Error("No hay registros para descargar")
    }

    const doc = await generatePDF(registros)
    const defaultFilename = `registro-choferes-${new Date().toISOString().split("T")[0]}.pdf`
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

    // Crear ventana de impresión
    const printWindow = window.open(pdfUrl, "_blank")

    if (!printWindow) {
      // Si no se puede abrir ventana, intentar descarga directa
      console.log("⚠️ No se pudo abrir ventana, intentando descarga...")
      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = `registro-choferes-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Limpiar URL después de un tiempo
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 1000)

      throw new Error("No se pudo abrir la ventana de impresión. El archivo se descargó en su lugar.")
    }

    printWindow.onload = () => {
      console.log("📄 Ventana cargada, iniciando impresión...")
      setTimeout(() => {
        printWindow.print()
        // Limpiar URL después de un tiempo
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl)
          printWindow.close()
        }, 1000)
      }, 500)
    }

    // Fallback si onload no funciona
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

// Función para verificar si las librerías están disponibles
export const checkPDFLibraries = async () => {
  try {
    const jsPDF = await loadPDFLibraries()
    const doc = new jsPDF()

    if (typeof doc.autoTable !== "function") {
      throw new Error("jspdf-autotable no está disponible")
    }

    console.log("✅ Librerías PDF verificadas correctamente")
    return true
  } catch (error) {
    console.error("❌ Error verificando librerías PDF:", error)
    return false
  }
}

// Función alternativa simple sin autoTable (fallback)
export const generateSimplePDF = async (registros: ChoferRegistro[]) => {
  try {
    console.log("🔄 Generando PDF simple...")

    const jsPDF = (await import("jspdf")).default
    const doc = new jsPDF()

    // Título
    doc.setFontSize(16)
    doc.text("Registro de Choferes", 105, 20, { align: "center" })

    // Fecha
    doc.setFontSize(10)
    const fecha = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })
    doc.text(`Generado: ${fecha}`, 105, 30, { align: "center" })

    // Registros
    let y = 50
    doc.setFontSize(8)

    registros.forEach((registro, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      const fechaHora = new Date(registro.fecha_hora).toLocaleString("es-PE", {
        timeZone: "America/Lima",
      })

      doc.text(`${index + 1}. ${registro.nombre_chofer} - ${registro.tipo}`, 10, y)
      y += 5
      doc.text(`   Destino: ${registro.destino || "-"}`, 10, y)
      y += 5
      doc.text(`   Responsable: ${registro.responsable || "-"}`, 10, y)
      y += 5
      doc.text(`   Fecha: ${fechaHora}`, 10, y)
      y += 10
    })

    return doc
  } catch (error) {
    console.error("❌ Error generando PDF simple:", error)
    throw error
  }
}
