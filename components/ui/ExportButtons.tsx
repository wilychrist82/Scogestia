'use client'

import { useState } from 'react'

type Props = {
  data: any[]
  filename: string
  headers?: { key: string; label: string }[]
}

export function ExportButtons({ data, filename, headers }: Props) {
  const [isExporting, setIsExporting] = useState(false)

  const exportCSV = () => {
    setIsExporting(true)
    try {
      if (!data || data.length === 0) return

      // Extraire les clés si headers non fourni
      const keys = headers ? headers.map(h => h.key) : Object.keys(data[0])
      const columnLabels = headers ? headers.map(h => h.label) : keys

      // Créer l'en-tête CSV
      let csvContent = columnLabels.join(';') + '\n'

      // Ajouter les lignes
      data.forEach(row => {
        const rowData = keys.map(key => {
          let cellData = row[key]
          if (cellData === null || cellData === undefined) cellData = ''
          // Échapper les guillemets et encapsuler dans des guillemets
          return `"${String(cellData).replace(/"/g, '""')}"`
        })
        csvContent += rowData.join(';') + '\n'
      })

      // Créer le fichier et le télécharger
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }) // BOM for Excel
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erreur lors de l'export CSV", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportPDF = () => {
    // Une méthode simple est d'utiliser la boîte de dialogue d'impression
    // qui permet de sauvegarder en PDF, ou on peut utiliser jsPDF.
    // Pour l'instant, on utilise l'impression native optimisée (print:hidden sur les éléments non désirés)
    window.print()
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button 
        onClick={exportCSV} 
        disabled={isExporting || !data || data.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border border-[var(--color-outline-variant)] rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-bright)] hover:text-[var(--color-on-surface)] transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">table</span>
        CSV
      </button>
      <button 
        onClick={exportPDF} 
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border border-[var(--color-outline-variant)] rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-bright)] hover:text-[var(--color-on-surface)] transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
        PDF
      </button>
    </div>
  )
}
