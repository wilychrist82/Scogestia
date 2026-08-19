import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { renderToStream } from '@react-pdf/renderer'
import { BulletinDocument } from '@/components/pdf/BulletinDocument'
import React from 'react'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')
    const term = searchParams.get('term')

    if (!student_id || !term) {
      return NextResponse.json({ error: 'Missing student_id or term' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Authentification & Vérification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Le parent est-il lié à cet élève ? (RLS parent_student_ids le garantit si on requête les tables)
    const { data: student } = await supabase
      .from('students')
      .select('first_name, last_name, class_id')
      .eq('id', student_id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 403 })
    }

    // 2. Vérification du cache dans Supabase Storage
    const filePath = `${student_id}/${term}.pdf`
    
    // On essaie de récupérer une URL signée ou publique
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('bulletins')
      .download(filePath)

    if (!downloadError && fileData) {
      // CACHE HIT
      return new NextResponse(fileData, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="Bulletin_${student.first_name}_${term}.pdf"`
        }
      })
    }

    // 3. CACHE MISS : Génération du PDF
    // Récupérer les notes
    const { data: grades } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', student_id)
      .eq('term', term)
      .order('subject_name', { ascending: true })

    // Récupérer la moyenne et le rang
    const { data: termSummary } = await supabase
      .from('student_term_summary')
      .select('term_average, class_rank')
      .eq('student_id', student_id)
      .eq('term', term)
      .single()

    if (!grades || grades.length === 0) {
      return NextResponse.json({ error: 'Aucune note disponible pour ce trimestre' }, { status: 404 })
    }

    // Générer le PDF
    const pdfStream = await renderToStream(
      <BulletinDocument 
        student={student}
        term={term}
        termSummary={termSummary}
        grades={grades}
      />
    )

    // Convertir le stream Node.js en Buffer pour l'uploader
    const chunks: Buffer[] = []
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    // 4. Sauvegarder dans le cache avec Service Role (car le parent n'a pas forcément le droit d'INSERT)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: uploadError } = await supabaseAdmin.storage
      .from('bulletins')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error("Upload Error:", uploadError)
      Sentry.captureException(new Error(`Failed to upload bulletin to storage: ${uploadError.message}`), {
        tags: { feature: 'bulletin_generation', student_id, term }
      })
      // On continue quand même car on peut servir le buffer en direct, le cache a juste raté
    }

    // 5. Retourner le PDF généré
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Bulletin_${student.first_name}_${term}.pdf"`
      }
    })

  } catch (error: any) {
    console.error("PDF Generation Error:", error)
    Sentry.captureException(error, { 
      tags: { feature: 'bulletin_generation', severity: 'critical' } 
    })
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
