'use client'

interface CapacitorWindowLike {
  Capacitor?: {
    isNativePlatform?: () => boolean
  }
}

export interface PdfLikeDocument {
  output: (type: 'blob') => Blob
  save: (filename: string) => void
}

/**
 * Détecte si l'application s'exécute dans la coque native Capacitor (Android/iOS).
 */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as CapacitorWindowLike).Capacitor
  return Boolean(cap?.isNativePlatform?.())
}

/**
 * Déclenche un téléchargement standard via un lien temporaire dans le navigateur Web.
 */
export function triggerWebBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Télécharge un Blob sur navigateur Web ou ouvre la feuille de partage native sur Capacitor.
 */
export async function saveOrShareBlob({
  blob,
  filename,
  title,
  text,
}: {
  blob: Blob
  filename: string
  title?: string
  text?: string
}): Promise<'shared' | 'cancelled' | 'downloaded'> {
  if (
    isCapacitorNative() &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  ) {
    const file = new File([blob], filename, {
      type: blob.type || 'application/octet-stream',
    })
    const canShareFiles =
      typeof navigator.canShare !== 'function' ||
      navigator.canShare({ files: [file] })

    if (canShareFiles) {
      try {
        await navigator.share({
          files: [file],
          title: title ?? filename,
          ...(text ? { text } : {}),
        })
        return 'shared'
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return 'cancelled'
        }
      }
    }
  }

  triggerWebBlobDownload(blob, filename)
  return 'downloaded'
}

/**
 * Exporte un document jsPDF via le partage natif sur Capacitor ou doc.save() sur Web.
 */
export async function saveOrSharePdf(
  doc: PdfLikeDocument,
  filename: string,
  title?: string,
  text?: string,
): Promise<'shared' | 'cancelled' | 'downloaded'> {
  if (
    isCapacitorNative() &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  ) {
    const pdfBlob = doc.output('blob')
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })
    const canShareFiles =
      typeof navigator.canShare !== 'function' ||
      navigator.canShare({ files: [pdfFile] })

    if (canShareFiles) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: title ?? filename,
          ...(text ? { text } : {}),
        })
        return 'shared'
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return 'cancelled'
        }
      }
    }
  }

  doc.save(filename)
  return 'downloaded'
}

/**
 * Lance l'impression Web ou informe l'utilisateur sur WebView Capacitor où window.print est souvent bloqué.
 */
export function triggerPrintOrNotify(
  onNativeFallback?: (message: string) => void,
): boolean {
  if (isCapacitorNative()) {
    onNativeFallback?.(
      "L'impression directe n'est pas prise en charge dans l'application mobile. Utilisez l'export PDF ou Excel pour partager ou imprimer.",
    )
    return false
  }
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print()
    return true
  }
  return false
}
