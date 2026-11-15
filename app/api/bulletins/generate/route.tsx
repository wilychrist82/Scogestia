import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { BULLETIN_GENERATION_ROLES } from '@/lib/roles'
import { renderToStream } from '@react-pdf/renderer'
import { BulletinDocument, BulletinPage, BulletinData } from '@/components/pdf/BulletinDocument'
import React from 'react'
import { Document } from '@react-pdf/renderer'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authentification & Vérification (Direction / Administration académique uniquement)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .in('role', [...BULLETIN_GENERATION_ROLES])
      .limit(1)
      .maybeSingle()

    if (!roleData?.school_id) {
      return NextResponse.json({ 
        error: "Accès interdit : La génération et la publication des bulletins et livrets sont strictement réservées à la direction / administration." 
      }, { status: 403 })
    }

    const body = await request.json()
    const { dataList, action } = body as { dataList: BulletinData[], action?: 'download' | 'publish' }

    if (!dataList || dataList.length === 0) {
      return NextResponse.json({ error: 'Missing dataList' }, { status: 400 })
    }

    // 2. Générer le PDF
    let pdfStream;
    if (dataList.length === 1) {
      pdfStream = await renderToStream(<BulletinDocument data={dataList[0]} />)
    } else {
      pdfStream = await renderToStream(
        <Document>
          {dataList.map((data, i) => (
            <BulletinPage key={i} data={data} />
          ))}
        </Document>
      )
    }

    // Convertir le stream Node.js en Buffer
    const chunks: Buffer[] = []
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    // 3. Publier si demandé (uniquement si 1 seul élève et appartenance vérifiée à l'école)
    if (action === 'publish' && dataList.length === 1) {
      const data = dataList[0]
      const candidateStudentId = (data.student as { id?: string })?.id

      if (!candidateStudentId) {
        return NextResponse.json(
          { error: "Identifiant de l'élève manquant pour la publication." },
          { status: 400 }
        )
      }

      const supabaseAdmin = createServiceRoleClient()

      // Contrôle strict multi-tenant : l'élève publié doit appartenir à l'établissement de l'utilisateur
      const { data: studentRecord, error: studentErr } = await supabaseAdmin
        .from('students')
        .select('id, school_id')
        .eq('id', candidateStudentId)
        .eq('school_id', roleData.school_id)
        .maybeSingle()

      if (studentErr || !studentRecord) {
        return NextResponse.json(
          { error: "Accès interdit : Cet élève n'appartient pas à votre établissement." },
          { status: 403 }
        )
      }

      const safeSchoolFolder = (data.schoolName || 'ecole').replace(/[^a-zA-Z0-9_-]/g, '_')
      const safeTerm = (data.termOrMonth || 'periode').replace(/[^a-zA-Z0-9_-]/g, '_')
      const filePath = `${safeSchoolFolder}/${studentRecord.id}_${safeTerm}.pdf`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('bulletins')
        .upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) {
        throw new Error('Erreur de téléversement du PDF: ' + uploadError.message)
      }

      const { data: urlData } = supabaseAdmin.storage.from('bulletins').getPublicUrl(filePath)

      const { error: upsertError } = await supabaseAdmin.from('published_bulletins').upsert({
        student_id: studentRecord.id,
        school_id: roleData.school_id,
        term_or_month: data.termOrMonth,
        academic_year: data.academicYear,
        file_url: urlData.publicUrl
      }, { onConflict: 'student_id, term_or_month, academic_year' })

      if (upsertError) {
        throw new Error('Erreur base de données lors de la publication: ' + upsertError.message)
      }
    }

    // 4. Retourner le PDF généré
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Bulletins.pdf"`
      }
    })

  } catch (error) {
    console.error("PDF Generation Error:", error)
    return NextResponse.json({ error: 'Erreur lors de la génération du bulletin PDF.' }, { status: 500 })
  }
}
