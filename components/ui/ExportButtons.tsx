'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileSpreadsheet, FileText, Printer, Download, Loader2, ChevronDown } from 'lucide-react'

type Props = {
  data: any[]
  filename: string
  headers?: { key: string; label: string }[]
  /** Titre affiché dans les exports */
  title?: string
}

export function ExportButtons({ data, filename, headers, title }: Props) {
  const [loading, setLoading] = useState<'csv' | 'excel' | 'print' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const isEmpty = !data || data.length === 0

  // ── CSV ───────────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    if (isEmpty) return
    setLoading('csv')
    try {
      const keys = headers ? headers.map(h => h.key) : Object.keys(data[0])
      const columnLabels = headers ? headers.map(h => h.label) : keys
      let csvContent = columnLabels.join(';') + '\n'
      data.forEach(row => {
        const rowData = keys.map(key => {
          let cellData = row[key]
          if (cellData === null || cellData === undefined) cellData = ''
          return `"${String(cellData).replace(/"/g, '""')}"`
        })
        csvContent += rowData.join(';') + '\n'
      })
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: 'text/csv;charset=utf-8;' })
      triggerDownload(blob, `${filename}_${today()}.csv`)
    } finally {
      setLoading(null)
      setMenuOpen(false)
    }
  }

  // ── Excel ─────────────────────────────────────────────────────────────────
  const exportExcel = async () => {
    if (isEmpty) return
    setLoading('excel')
    try {
      const xlsx = await import('xlsx')
      const keys = headers ? headers.map(h => h.key) : Object.keys(data[0])
      const columnLabels = headers ? headers.map(h => h.label) : keys

      const wsData = [
        columnLabels,
        ...data.map(row => keys.map(k => {
          const v = row[k]
          return v === null || v === undefined ? '' : v
        }))
      ]

      const ws = xlsx.utils.aoa_to_sheet(wsData)

      // Style : largeur auto des colonnes
      ws['!cols'] = columnLabels.map(() => ({ wch: 22 }))

      const wb = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(wb, ws, title || filename)
      xlsx.writeFile(wb, `${filename}_${today()}.xlsx`)
    } catch (err) {
      console.error('[Excel Export Error]', err)
    } finally {
      setLoading(null)
      setMenuOpen(false)
    }
  }

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    setLoading('print')
    setTimeout(() => {
      window.print()
      setLoading(null)
      setMenuOpen(false)
    }, 150)
  }

  return (
    <div className="relative print:hidden">
      {/* Main export button */}
      <div className="flex items-center gap-0">
        {/* Primary action: Excel */}
        <button
          onClick={exportExcel}
          disabled={isEmpty || loading !== null}
          className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-l-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: isEmpty ? 'rgba(0,0,0,0.04)' : 'linear-gradient(135deg,#217346,#1a5c38)',
            color: isEmpty ? 'var(--color-on-surface-variant)' : '#ffffff',
            boxShadow: isEmpty ? 'none' : '0 2px 12px rgba(33,115,70,0.3)',
          }}
        >
          {loading === 'excel' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          Excel
        </button>

        {/* Divider */}
        <div
          className="w-px self-stretch"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        />

        {/* Dropdown trigger */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          disabled={isEmpty || loading !== null}
          className="flex items-center px-2 py-2 text-sm rounded-r-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: isEmpty ? 'rgba(0,0,0,0.04)' : 'linear-gradient(135deg,#217346,#1a5c38)',
            color: isEmpty ? 'var(--color-on-surface-variant)' : '#ffffff',
            boxShadow: isEmpty ? 'none' : '0 2px 12px rgba(33,115,70,0.3)',
          }}
        >
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{ transform: menuOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[180px]"
            >
              {/* Outer bezel */}
              <div
                className="rounded-xl p-0.5 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))',
                }}
              >
                {/* Inner */}
                <div
                  className="rounded-[10px] overflow-hidden"
                  style={{
                    background: 'linear-gradient(160deg,#0f1823,#0b0f19)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <ExportMenuItem
                    icon={<FileText className="w-4 h-4 text-blue-400" />}
                    label="Exporter CSV"
                    sublabel="Séparateur point-virgule, UTF-8"
                    loading={loading === 'csv'}
                    onClick={exportCSV}
                  />
                  <ExportMenuItem
                    icon={<FileSpreadsheet className="w-4 h-4 text-green-400" />}
                    label="Exporter Excel"
                    sublabel="Format .xlsx compatible Office"
                    loading={loading === 'excel'}
                    onClick={exportExcel}
                  />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <ExportMenuItem
                    icon={<Printer className="w-4 h-4 text-slate-400" />}
                    label="Imprimer / PDF"
                    sublabel="Via la boîte de dialogue système"
                    loading={loading === 'print'}
                    onClick={handlePrint}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────
function ExportMenuItem({
  icon, label, sublabel, loading, onClick,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 px-4 py-3 text-left group transition-all duration-200 hover:bg-white/5 disabled:opacity-50"
    >
      <span className="flex-shrink-0">
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : icon}
      </span>
      <div>
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className="text-[10px] text-slate-500">{sublabel}</p>
      </div>
      <Download className="w-3 h-3 ml-auto text-slate-600 group-hover:text-emerald-400 transition-colors" />
    </button>
  )
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
