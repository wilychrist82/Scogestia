# Guide d'intervention Claude Code - SCOGESTIA

## Directives d'optimisation de tokens (ÉCONOMIE STRICTE)
- Ne scanne JAMAIS les dossiers : `node_modules/`, `.next/`, `android/`, `.git/`, `dist/`, `public/`.
- Recherche uniquement dans `app/`, `components/`, `lib/`, `hooks/`, et `supabase/`.
- Ne réécris pas des fichiers entiers si une modification locale ou une explication suffit.
- Reste concis, précis et factuel : pas de bavardage, va droit au but.

## Stack Technique
- Framework : Next.js 15 (App Router), React 19, TypeScript
- Backend & Auth : Supabase (PostgreSQL avec RLS multi-tenant par `school_id`)
- Styles : Tailwind CSS, Lucide Icons, Shadcn-like UI
- Rôles : Super Admin, Admin/Direction, Enseignant, Comptable, Parent

## Mission Audit
- Priorité 1 : Vérifier la sécurité et l'isolation des données (`school_id`, RLS, middleware d'authentification).
- Priorité 2 : Gestion des erreurs (try/catch et toasts) dans les Server Actions et composants clients.
- Priorité 3 : Cas limites (utilisateurs sans données, pagination, états vides).
