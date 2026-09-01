import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { renderToStream } from '@react-pdf/renderer'
import { BulletinDocument, BulletinPage, BulletinData } from '@/components/pdf/BulletinDocument'
import React from 'react'
import { Document } from '@react-pdf/renderer'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authentification & Vérification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // 3. Publier si demandé (uniquement si 1 seul élève pour le moment, ou on pourrait boucler)
    if (action === 'publish' && dataList.length === 1) {
      const data = dataList[0];
      const trueStudentId = (data.student as any).id || dataList[0].student.matricule; // Fallback
      if (trueStudentId) {
        const filePath = `${data.schoolName.replace(/ /g, '_')}/${trueStudentId}_${data.termOrMonth}.pdf`;
        
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error: uploadError } = await supabaseAdmin.storage
          .from('bulletins')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage.from('bulletins').getPublicUrl(filePath)
          
          // Récupérer le school_id de l'admin actuel
          const { data: roleData } = await supabase.from('user_school_roles').select('school_id').eq('user_id', user.id).single();
          
          if (roleData) {
            const { error: upsertError } = await supabaseAdmin.from('published_bulletins').upsert({
              student_id: trueStudentId,
              school_id: roleData.school_id,
              term_or_month: data.termOrMonth,
              academic_year: data.academicYear,
              file_url: urlData.publicUrl
            }, { onConflict: 'student_id, term_or_month, academic_year' });
            
            if (upsertError) {
              throw new Error("Erreur base de données lors de la publication: " + upsertError.message);
            }
          } else {
            throw new Error("Impossible de déterminer l'école de l'utilisateur pour publier le bulletin.");
          }
        } else {
          throw new Error("Erreur de téléversement du PDF: " + uploadError.message);
        }
      }
    }

    // 4. Retourner le PDF généré
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Bulletins.pdf"`
      }
    })

  } catch (error: any) {
    console.error("PDF Generation Error:", error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
