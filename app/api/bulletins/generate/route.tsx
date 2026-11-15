import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { BULLETIN_GENERATION_ROLES } from '@/lib/roles'
import { chunkArray, runInBatches } from '@/lib/collections'
import { renderToStream, Document } from '@react-pdf/renderer'
import { BulletinDocument, BulletinPage, BulletinData } from '@/components/pdf/BulletinDocument'
import React from 'react'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PUBLISH_CONCURRENCY = 5

async function renderPdfToBuffer(element: React.ReactElement<React.ComponentProps<typeof Document>>): Promise<Buffer> {
  const pdfStream = await renderToStream(element)
  const chunks: Buffer[] = []
  for await (const chunk of pdfStream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function getStudentId(data: BulletinData): string | undefined {
  return (data.student as { id?: string } | undefined)?.id
}

async function verifyStudentsBelongToSchool(
  supabaseAdmin: ReturnType<typeof createServiceRoleClient>,
  schoolId: string,
  studentIds: string[],
): Promise<boolean> {
  const uniqueIds = Array.from(new Set(studentIds))
  const foundIds = new Set<string>()

  for (const idChunk of chunkArray(uniqueIds, 200)) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('school_id', schoolId)
      .in('id', idChunk)

    if (error) {
      throw new Error('Erreur vérification élèves: ' + error.message)
    }
    for (const row of data ?? []) {
      foundIds.add(row.id)
    }
  }

  return uniqueIds.every((id) => foundIds.has(id))
}

async function notifyLinkedParents(
  supabaseAdmin: ReturnType<typeof createServiceRoleClient>,
  schoolId: string,
  publishedItems: BulletinData[],
): Promise<number> {
  const studentMap = new Map<string, BulletinData>()
  for (const item of publishedItems) {
    const sid = getStudentId(item)
    if (sid) studentMap.set(sid, item)
  }

  const studentIds = Array.from(studentMap.keys())
  if (studentIds.length === 0) return 0

  const links: Array<{ parent_user_id: string; student_id: string }> = []
  for (const idChunk of chunkArray(studentIds, 200)) {
    const { data, error } = await supabaseAdmin
      .from('parent_student_links')
      .select('parent_user_id, student_id')
      .in('student_id', idChunk)

    if (error) {
      console.error('Notification parent links lookup warning:', error.message)
      return 0
    }
    for (const row of data ?? []) {
      if (row.parent_user_id && row.student_id) {
        links.push({ parent_user_id: row.parent_user_id, student_id: row.student_id })
      }
    }
  }

  if (links.length === 0) return 0

  const seenKeys = new Set<string>()
  const notificationRows: Array<{
    school_id: string
    user_id: string
    title: string
    message: string
    type: string
    is_read: boolean
    action_url: string
  }> = []

  for (const link of links) {
    const dedupKey = `${link.parent_user_id}:${link.student_id}`
    if (seenKeys.has(dedupKey)) continue
    seenKeys.add(dedupKey)

    const item = studentMap.get(link.student_id)
    const studentName = `${item?.student?.first_name ?? ''} ${item?.student?.last_name ?? ''}`.trim() || 'votre enfant'
    const periodLabel = item?.termOrMonth ? ` (${item.termOrMonth})` : ''

    notificationRows.push({
      school_id: schoolId,
      user_id: link.parent_user_id,
      title: 'Nouveau bulletin disponible',
      message: `Le bulletin de ${studentName}${periodLabel} est désormais disponible dans votre Espace Parent.`,
      type: 'academique',
      is_read: false,
      action_url: '/parent/bulletins',
    })
  }

  for (const rowChunk of chunkArray(notificationRows, 200)) {
    const { error } = await supabaseAdmin.from('notifications').insert(rowChunk)
    if (error) {
      console.error('Notification insert warning:', error.message)
    }
  }

  return notificationRows.length
}

async function renderAndUploadStudentBulletin(
  supabaseAdmin: ReturnType<typeof createServiceRoleClient>,
  schoolId: string,
  data: BulletinData,
  preRenderedBuffer?: Buffer,
) {
  const studentId = getStudentId(data)
  if (!studentId) {
    throw new Error("Identifiant de l'élève manquant pour la publication.")
  }

  const pdfBuffer = preRenderedBuffer ?? (await renderPdfToBuffer(<BulletinDocument data={data} />))
  const safeSchoolFolder = (data.schoolName || 'ecole').replace(/[^a-zA-Z0-9_-]/g, '_')
  const safeTerm = (data.termOrMonth || 'periode').replace(/[^a-zA-Z0-9_-]/g, '_')
  const filePath = `${safeSchoolFolder}/${studentId}_${safeTerm}.pdf`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('bulletins')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    throw new Error('Erreur de téléversement du PDF: ' + uploadError.message)
  }

  const { data: urlData } = supabaseAdmin.storage.from('bulletins').getPublicUrl(filePath)

  return {
    student_id: studentId,
    school_id: schoolId,
    term_or_month: data.termOrMonth,
    academic_year: data.academicYear,
    file_url: urlData.publicUrl,
  }
}

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
        error: "Accès interdit : La génération et la publication des bulletins et livrets sont strictement réservées à la direction / administration.",
      }, { status: 403 })
    }

    const body = await request.json()
    const { dataList, action } = body as { dataList: BulletinData[], action?: 'download' | 'publish' }

    if (!dataList || dataList.length === 0) {
      return NextResponse.json({ error: 'Missing dataList' }, { status: 400 })
    }

    // 2. Publication individuelle OU par classe entière
    if (action === 'publish') {
      const candidateIds = dataList.map(getStudentId)
      if (candidateIds.some((id) => !id)) {
        return NextResponse.json(
          { error: "Identifiant d'élève manquant pour un ou plusieurs bulletins." },
          { status: 400 },
        )
      }

      const validStudentIds = candidateIds as string[]
      const supabaseAdmin = createServiceRoleClient()

      const allOwnedBySchool = await verifyStudentsBelongToSchool(
        supabaseAdmin,
        roleData.school_id,
        validStudentIds,
      )
      if (!allOwnedBySchool) {
        return NextResponse.json(
          { error: "Accès interdit : Un ou plusieurs élèves n'appartiennent pas à votre établissement." },
          { status: 403 },
        )
      }

      // Cas 1 élève : on conserve la réponse binaire PDF historique + notification parent
      if (dataList.length === 1) {
        const singlePdfBuffer = await renderPdfToBuffer(<BulletinDocument data={dataList[0]} />)
        const row = await renderAndUploadStudentBulletin(
          supabaseAdmin,
          roleData.school_id,
          dataList[0],
          singlePdfBuffer,
        )

        const { error: upsertError } = await supabaseAdmin
          .from('published_bulletins')
          .upsert(row, { onConflict: 'student_id, term_or_month, academic_year' })

        if (upsertError) {
          throw new Error('Erreur base de données lors de la publication: ' + upsertError.message)
        }

        await notifyLinkedParents(supabaseAdmin, roleData.school_id, dataList)

        return new NextResponse(new Uint8Array(singlePdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="Bulletins.pdf"`,
          },
        })
      }

      // Cas classe complète (N > 1) : génération/upload individuel par élève en lots bornés (isolation parent stricte)
      const upsertRows = await runInBatches(dataList, PUBLISH_CONCURRENCY, (item) =>
        renderAndUploadStudentBulletin(supabaseAdmin, roleData.school_id, item),
      )

      for (const rowChunk of chunkArray(upsertRows, 200)) {
        const { error: upsertError } = await supabaseAdmin
          .from('published_bulletins')
          .upsert(rowChunk, { onConflict: 'student_id, term_or_month, academic_year' })

        if (upsertError) {
          throw new Error('Erreur base de données lors de la publication groupée: ' + upsertError.message)
        }
      }

      const notifiedParents = await notifyLinkedParents(supabaseAdmin, roleData.school_id, dataList)

      return NextResponse.json({
        success: true,
        publishedCount: upsertRows.length,
        notifiedParents,
      })
    }

    // 3. Téléchargement PDF combiné (download)
    const pdfBuffer =
      dataList.length === 1
        ? await renderPdfToBuffer(<BulletinDocument data={dataList[0]} />)
        : await renderPdfToBuffer(
            <Document>
              {dataList.map((data, i) => (
                <BulletinPage key={i} data={data} />
              ))}
            </Document>,
          )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Bulletins.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération du bulletin PDF.' }, { status: 500 })
  }
}
