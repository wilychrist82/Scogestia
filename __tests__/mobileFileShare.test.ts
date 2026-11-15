import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isCapacitorNative,
  saveOrShareBlob,
  saveOrSharePdf,
  triggerPrintOrNotify,
} from '../lib/mobile-file-share'

function stubBrowserDom() {
  const click = vi.fn()
  const link = { href: '', download: '', click }
  const appendChild = vi.fn()
  const removeChild = vi.fn()
  const createElement = vi.fn(() => link)
  const createObjectURL = vi.fn(() => 'blob:mock-url')
  const revokeObjectURL = vi.fn()

  vi.stubGlobal('document', {
    createElement,
    body: { appendChild, removeChild },
  })
  vi.stubGlobal('URL', {
    createObjectURL,
    revokeObjectURL,
  })

  return { click, link, appendChild, removeChild, createElement, createObjectURL, revokeObjectURL }
}

describe('mobile-file-share helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('detects Capacitor native platform safely', () => {
    expect(isCapacitorNative()).toBe(false)

    vi.stubGlobal('window', {})
    expect(isCapacitorNative()).toBe(false)

    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => false } })
    expect(isCapacitorNative()).toBe(false)

    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true } })
    expect(isCapacitorNative()).toBe(true)
  })

  it('triggers standard Web download when running outside Capacitor', async () => {
    const dom = stubBrowserDom()
    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => false } })

    const blob = new Blob(['id;nom\n1;Koffi'], { type: 'text/csv' })
    const result = await saveOrShareBlob({
      blob,
      filename: 'eleves.csv',
      title: 'Liste élèves',
    })

    expect(result).toBe('downloaded')
    expect(dom.createElement).toHaveBeenCalledWith('a')
    expect(dom.link.download).toBe('eleves.csv')
    expect(dom.click).toHaveBeenCalledTimes(1)
    expect(dom.appendChild).toHaveBeenCalledWith(dom.link)
    expect(dom.removeChild).toHaveBeenCalledWith(dom.link)
  })

  it('uses native navigator.share for blobs on Capacitor Android/iOS', async () => {
    const dom = stubBrowserDom()
    const share = vi.fn().mockResolvedValue(undefined)
    const canShare = vi.fn().mockReturnValue(true)

    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true } })
    vi.stubGlobal('navigator', { share, canShare })

    const blob = new Blob(['xlsx-bytes'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const result = await saveOrShareBlob({
      blob,
      filename: 'bulletin.xlsx',
      title: 'Bulletin 6ème A',
    })

    expect(result).toBe('shared')
    expect(canShare).toHaveBeenCalledTimes(1)
    expect(share).toHaveBeenCalledTimes(1)
    expect(dom.click).not.toHaveBeenCalled()
  })

  it('returns cancelled without falling back to Web download when user cancels share sheet', async () => {
    const dom = stubBrowserDom()
    const abortErr = new DOMException('Share cancelled', 'AbortError')
    const share = vi.fn().mockRejectedValue(abortErr)

    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true } })
    vi.stubGlobal('navigator', { share, canShare: () => true })

    const blob = new Blob(['pdf-bytes'], { type: 'application/pdf' })
    const result = await saveOrShareBlob({
      blob,
      filename: 'recu.pdf',
      title: 'Reçu Scogestia',
    })

    expect(result).toBe('cancelled')
    expect(dom.click).not.toHaveBeenCalled()
  })

  it('shares PDF via navigator.share on Capacitor and falls back to doc.save on Web', async () => {
    const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    const doc = {
      output: vi.fn(() => pdfBlob),
      save: vi.fn(),
    }

    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true } })
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, canShare: () => true })

    const nativeResult = await saveOrSharePdf(doc, 'certificat.pdf', 'Certificat', 'Élève')
    expect(nativeResult).toBe('shared')
    expect(share).toHaveBeenCalledTimes(1)
    expect(doc.save).not.toHaveBeenCalled()

    vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => false } })
    const webResult = await saveOrSharePdf(doc, 'certificat.pdf', 'Certificat')
    expect(webResult).toBe('downloaded')
    expect(doc.save).toHaveBeenCalledWith('certificat.pdf')
  })

  it('notifies cleanly instead of calling window.print on Capacitor WebView', () => {
    const printMock = vi.fn()
    const notify = vi.fn()

    vi.stubGlobal('window', {
      Capacitor: { isNativePlatform: () => true },
      print: printMock,
    })

    const printedOnMobile = triggerPrintOrNotify(notify)
    expect(printedOnMobile).toBe(false)
    expect(printMock).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledTimes(1)

    vi.stubGlobal('window', {
      Capacitor: { isNativePlatform: () => false },
      print: printMock,
    })

    const printedOnWeb = triggerPrintOrNotify(notify)
    expect(printedOnWeb).toBe(true)
    expect(printMock).toHaveBeenCalledTimes(1)
  })
})
