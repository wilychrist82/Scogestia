import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      <p className="text-slate-500 font-medium animate-pulse">Chargement en cours...</p>
    </div>
  )
}
