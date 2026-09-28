'use client'

import { useState, useTransition, FormEvent } from 'react'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { updateUserProfile } from '@/app/actions/parametres'
import { createClient } from '@/lib/supabase/client'
import { User, Lock, Mail, Phone, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Props = {
  userId: string
  fullName: string
  email: string
  phone?: string
  role: string
  userAvatar?: string
}

export function AdminProfileManager({ userId, fullName, email, phone, role, userAvatar }: Props) {
  const [isPending, startTransition] = useTransition()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Password state
  const [passwordPending, setPasswordPending] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateUserProfile({}, formData)
      if (result?.error) {
        setProfileError(result.error)
      } else {
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 4000)
      }
    })
  }

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit comporter au moins 6 caractères.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.')
      return
    }

    setPasswordPending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordSuccess(false), 4000)
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Une erreur est survenue.')
    } finally {
      setPasswordPending(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation retour */}
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/parametres" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux paramètres
          </Link>
        </div>

        {/* En-tête */}
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-outline-variant)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl">
              {fullName ? fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{fullName || 'Mon Compte'}</h1>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {role === 'admin' ? 'Administrateur / Secrétaire' : role}
                </span>
                <span>•</span>
                <span>{email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Section 1 : Informations personnelles */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[var(--color-outline-variant)] bg-slate-50/50 flex items-center gap-2">
            <User size={18} className="text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">Informations personnelles & Photo</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
            {profileError && (
              <div className="bg-rose-50 text-rose-700 p-3.5 rounded-xl border border-rose-200 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle size={16} className="flex-shrink-0 text-emerald-600" />
                Vos informations personnelles ont été mises à jour avec succès.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nom & Prénoms <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    defaultValue={fullName}
                    required
                    className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none bg-white font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={phone || ''}
                    placeholder="+228 90 00 00 00"
                    className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none bg-white font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Photo de profil (Avatar)
              </label>
              <ImageUpload
                name="profilePhotoUrl"
                bucket="avatars"
                folder={`admin_${userId}`}
                defaultUrl={userAvatar || null}
                label="Choisir une photo de profil (PNG, JPG)"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Cette photo apparaîtra dans l'en-tête et sur les documents administratifs signés.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Enregistrer mon profil
              </button>
            </div>
          </form>
        </div>

        {/* Section 2 : Sécurité & Changement de mot de passe */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[var(--color-outline-variant)] bg-slate-50/50 flex items-center gap-2">
            <Lock size={18} className="text-amber-600" />
            <h2 className="font-bold text-slate-900 text-sm">Sécurité & Mot de passe</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
            {passwordError && (
              <div className="bg-rose-50 text-rose-700 p-3.5 rounded-xl border border-rose-200 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle size={16} className="flex-shrink-0 text-emerald-600" />
                Votre mot de passe a été modifié avec succès.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caractères"
                    required
                    className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:border-amber-500 outline-none bg-white font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    required
                    className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:border-amber-500 outline-none bg-white font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={passwordPending}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {passwordPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Changer mon mot de passe
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
