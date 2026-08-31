import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10, color: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10 },
  headerCol: { flexDirection: 'column', alignItems: 'center', width: '33%' },
  headerLeft: { flexDirection: 'column', alignItems: 'flex-start', width: '33%' },
  headerRight: { flexDirection: 'column', alignItems: 'flex-end', width: '33%' },
  titleText: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  subtitleText: { fontSize: 9, fontFamily: 'Helvetica-Oblique' },
  schoolName: { fontSize: 16, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  bulletinTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  
  studentInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, padding: 10, backgroundColor: '#f9fafb', borderRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  infoCol: { flexDirection: 'column' },
  infoColCenter: { flexDirection: 'column', alignItems: 'center' },
  infoColRight: { flexDirection: 'column', alignItems: 'flex-end' },
  infoLabel: { fontSize: 8, color: '#4b5563' },
  infoValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },

  table: { width: '100%', borderWidth: 1, borderColor: '#000', marginBottom: 15 },
  rowHeader: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderBottomWidth: 1, borderBottomColor: '#000', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', fontSize: 9 },
  rowCategory: { backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#000', padding: 4 },
  catText: { fontFamily: 'Helvetica-BoldOblique', fontSize: 9 },
  
  // Secondary cols
  colSubj: { width: '22%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
  colScore: { width: '8%', padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  colMoy: { width: '10%', padding: 4, textAlign: 'center', backgroundColor: '#e5e7eb', fontFamily: 'Helvetica-Bold', borderRightWidth: 1, borderRightColor: '#000' },
  colCoef: { width: '6%', padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  colProd: { width: '10%', padding: 4, textAlign: 'center', backgroundColor: '#e5e7eb', fontFamily: 'Helvetica-Bold', borderRightWidth: 1, borderRightColor: '#000' },
  colProf: { width: '18%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontSize: 8 },
  colAppr: { width: '26%', padding: 4, fontSize: 8, fontFamily: 'Helvetica-Oblique' },

  // Primary cols
  colPrimSubj: { width: '25%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
  colPrimMonth: { width: '8%', padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  colPrimMoy: { width: '11%', padding: 4, textAlign: 'center', backgroundColor: '#e5e7eb', fontFamily: 'Helvetica-Bold' },

  rowTotal: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#000', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  colTotalLabelSec: { width: '38%', padding: 4, textAlign: 'right', borderRightWidth: 1, borderRightColor: '#000' },
  colTotalLabelPrim: { width: '25%', padding: 4, textAlign: 'right', borderRightWidth: 1, borderRightColor: '#000' },
  
  statsBox: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 15 },
  statItem: { padding: 10, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, alignItems: 'center', width: '45%' },
  statLabel: { fontSize: 9, color: '#4b5563', fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  statValue: { fontSize: 24, fontFamily: 'Helvetica-Bold' },
  statSub: { fontSize: 12, color: '#6b7280', fontFamily: 'Helvetica' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  gridItem: { flex: 1, marginHorizontal: 4, padding: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, alignItems: 'center' },

  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 10 },
  signBlock: { width: '30%', alignItems: 'center' },
  signTitle: { fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 30, fontSize: 10 },
  signText: { fontSize: 9, textAlign: 'center', marginTop: 10 },
  signTextBold: { fontSize: 9, textAlign: 'center', marginTop: 5, fontFamily: 'Helvetica-Bold' },
  
  decisionBox: { borderWidth: 1, borderColor: '#000', padding: 6, borderRadius: 4, width: '100%', marginBottom: 10 },
  decisionTitle: { fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginBottom: 4, fontSize: 9 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  checkbox: { width: 8, height: 8, borderWidth: 1, borderColor: '#000', marginRight: 4 },
  checkboxFilled: { width: 8, height: 8, backgroundColor: '#000', marginRight: 4 },
  checkboxLabel: { fontSize: 8 }
})

export type BulletinData = {
  level: 'primaire' | 'secondaire' | 'maternelle'
  student: { first_name: string; last_name: string; matricule: string }
  cls: { name: string }
  schoolName: string
  academicYear: string
  termOrMonth: string
  
  // Secondary specific
  secondaryRows?: Array<{
    id: string; name: string; cScore: string; compScore: string; moy: number | null; coefficient: number; produit: number | null; appr: string; profName?: string
  }>
  totalCoef?: number
  totalProduct?: number
  termAvg?: string
  rank?: string
  totalStudents?: number | string
  stats?: { min: string; max: string; annual: string; t1?: string; t2?: string; annual_t3?: string }
  footerInfo?: { appreciation: string; decision: string }
  
  // Primary specific
  primaryCategories?: Record<string, Array<{
    id: string; name: string; monthScores: Record<string, string>; avg: string
  }>>
  months?: number[]
  monthTotals?: Record<string, string>
  monthAvgs?: Record<string, string>
  monthRanks?: Record<string, string>
}

function renderSecondaryTable(data: BulletinData) {
  return (
    <View style={styles.table}>
      <View style={styles.rowHeader}>
        <Text style={styles.colSubj}>MATIÈRES</Text>
        <Text style={styles.colScore}>NOTE CL.</Text>
        <Text style={styles.colScore}>COMPO.</Text>
        <Text style={styles.colMoy}>MOY. /20</Text>
        <Text style={styles.colCoef}>COEF</Text>
        <Text style={styles.colProd}>PRODUIT</Text>
        <Text style={styles.colProf}>PROFESSEUR</Text>
        <Text style={styles.colAppr}>APPRÉCIATION</Text>
      </View>
      {data.secondaryRows?.map(row => (
        <View key={row.id} style={styles.row}>
          <Text style={[styles.colSubj, { fontFamily: 'Helvetica-Bold' }]}>{row.name}</Text>
          <Text style={styles.colScore}>{row.cScore}</Text>
          <Text style={styles.colScore}>{row.compScore}</Text>
          <Text style={styles.colMoy}>{row.moy !== null ? row.moy.toFixed(2) : ''}</Text>
          <Text style={styles.colCoef}>{row.coefficient}</Text>
          <Text style={styles.colProd}>{row.produit !== null ? row.produit.toFixed(2) : ''}</Text>
          <Text style={styles.colProf}>{row.profName || ''}</Text>
          <Text style={styles.colAppr}>{row.appr}</Text>
        </View>
      ))}
      <View style={styles.rowTotal}>
        <Text style={styles.colTotalLabelSec}>TOTAL</Text>
        <Text style={styles.colCoef}>{data.totalCoef}</Text>
        <Text style={styles.colProd}>{data.totalProduct?.toFixed(2)}</Text>
        <Text style={{ width: '44%' }}></Text>
      </View>
    </View>
  )
}

function renderPrimaryTable(data: BulletinData) {
  const months = data.months || [1,2,3,4,5,6,7,8,9];
  return (
    <View style={styles.table}>
      <View style={styles.rowHeader}>
        <Text style={styles.colPrimSubj}>DISCIPLINES</Text>
        {months.map(m => (
          <Text key={m} style={styles.colPrimMonth}>{m}e</Text>
        ))}
        <Text style={styles.colPrimMoy}>MOY.</Text>
      </View>
      {data.primaryCategories && Object.entries(data.primaryCategories).map(([cat, subjs]) => (
        <React.Fragment key={cat}>
          <View style={styles.rowCategory}>
            <Text style={styles.catText}>{cat}</Text>
          </View>
          {subjs.map(subj => (
            <View key={subj.id} style={styles.row}>
              <Text style={styles.colPrimSubj}>{subj.name}</Text>
              {months.map(m => (
                <Text key={m} style={styles.colPrimMonth}>{subj.monthScores[m] || ''}</Text>
              ))}
              <Text style={styles.colPrimMoy}>{subj.avg}</Text>
            </View>
          ))}
        </React.Fragment>
      ))}
      <View style={styles.rowTotal}>
        <Text style={styles.colTotalLabelPrim}>Total des points</Text>
        {months.map(m => (
          <Text key={m} style={styles.colPrimMonth}>{data.monthTotals?.[m] || ''}</Text>
        ))}
        <Text style={styles.colPrimMoy}></Text>
      </View>
      <View style={styles.rowTotal}>
        <Text style={styles.colTotalLabelPrim}>Moyenne / 10</Text>
        {months.map(m => (
          <Text key={m} style={[styles.colPrimMonth, { color: '#1e40af' }]}>{data.monthAvgs?.[m] || ''}</Text>
        ))}
        <Text style={styles.colPrimMoy}></Text>
      </View>
      <View style={styles.rowTotal}>
        <Text style={styles.colTotalLabelPrim}>Rang</Text>
        {months.map(m => (
          <Text key={m} style={styles.colPrimMonth}>{data.monthRanks?.[m] || ''}</Text>
        ))}
        <Text style={styles.colPrimMoy}></Text>
      </View>
    </View>
  )
}

function SecondaryFooter({ data }: { data: BulletinData }) {
  const avg = parseFloat(data.termAvg || '0')
  return (
    <View>
      <View style={styles.statsBox}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MOYENNE TRIMESTRIELLE</Text>
          <Text style={styles.statValue}>{data.termAvg} <Text style={styles.statSub}>/ 20</Text></Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>RANG</Text>
          <Text style={styles.statValue}>{data.rank || '-'} <Text style={styles.statSub}>/ {data.totalStudents || '-'}</Text></Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.gridItem}>
          <Text style={styles.statLabel}>Moyenne la plus faible</Text>
          <Text style={styles.statValue}>{data.stats?.min || '-'}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.statLabel}>Moyenne la plus forte</Text>
          <Text style={styles.statValue}>{data.stats?.max || '-'}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.statLabel}>Moyenne Annuelle</Text>
          <Text style={styles.statValue}>{data.stats?.annual || '-'}</Text>
        </View>
      </View>

      <View style={styles.signaturesRow}>
        <View style={styles.signBlock}>
          <Text style={styles.signTitle}>Le Professeur Principal</Text>
          <Text style={styles.signTextBold}>Appréciation :</Text>
          <Text style={styles.signText}>{data.footerInfo?.appreciation || ''}</Text>
        </View>
        <View style={styles.signBlock}>
          <View style={styles.decisionBox}>
            <Text style={styles.decisionTitle}>Décision du conseil</Text>
            <View style={styles.checkboxRow}><View style={avg >= 14 ? styles.checkboxFilled : styles.checkbox}/><Text style={styles.checkboxLabel}>Félicitations</Text></View>
            <View style={styles.checkboxRow}><View style={avg >= 12 && avg < 14 ? styles.checkboxFilled : styles.checkbox}/><Text style={styles.checkboxLabel}>Encouragements</Text></View>
            <View style={styles.checkboxRow}><View style={avg >= 10 && avg < 12 ? styles.checkboxFilled : styles.checkbox}/><Text style={styles.checkboxLabel}>Tableau d'honneur</Text></View>
            <View style={styles.checkboxRow}><View style={avg > 0 && avg < 10 ? styles.checkboxFilled : styles.checkbox}/><Text style={styles.checkboxLabel}>Avertissement</Text></View>
          </View>
        </View>
        <View style={styles.signBlock}>
          <Text style={styles.signTitle}>Le Chef d'Établissement</Text>
          <Text style={styles.signTextBold}>Décision :</Text>
          <Text style={styles.signText}>{data.footerInfo?.decision || ''}</Text>
        </View>
      </View>
    </View>
  )
}

function PrimaryFooter({ data }: { data: BulletinData }) {
  return (
    <View style={styles.signaturesRow}>
      <View style={styles.signBlock}>
        <Text style={styles.signTitle}>Le Titulaire</Text>
        <Text style={styles.signTextBold}>Appréciation :</Text>
        <Text style={styles.signText}>{data.footerInfo?.appreciation || ''}</Text>
      </View>
      <View style={styles.signBlock}>
        {/* Stamp placeholder */}
      </View>
      <View style={styles.signBlock}>
        <Text style={styles.signTitle}>Le Directeur / La Directrice</Text>
        <Text style={styles.signTextBold}>Décision :</Text>
        <Text style={styles.signText}>{data.footerInfo?.decision || ''}</Text>
      </View>
    </View>
  )
}

export function BulletinPage({ data }: { data: BulletinData }) {
  return (
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.titleText}>RÉPUBLIQUE TOGOLAISE</Text>
            <Text style={styles.subtitleText}>Travail - Liberté - Patrie</Text>
          </View>
          <View style={styles.headerCol}>
            <Text style={styles.schoolName}>{data.schoolName}</Text>
            <Text style={styles.bulletinTitle}>
              {data.level === 'primaire' || data.level === 'maternelle' ? 'LIVRET SCOLAIRE' : 'BULLETIN DE NOTES'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.titleText}>Année : {data.academicYear}</Text>
            {data.level === 'secondaire' && (
              <Text style={styles.subtitleText}>{data.termOrMonth.replace(/_/g, ' ').toUpperCase()}</Text>
            )}
          </View>
        </View>

        <View style={styles.studentInfo}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Nom et Prénom(s)</Text>
            <Text style={styles.infoValue}>{data.student.last_name} {data.student.first_name}</Text>
          </View>
          <View style={styles.infoColCenter}>
            <Text style={styles.infoLabel}>Classe</Text>
            <Text style={styles.infoValue}>{data.cls.name}</Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.infoLabel}>Matricule</Text>
            <Text style={styles.infoValue}>{data.student.matricule}</Text>
          </View>
        </View>

        {data.level === 'secondaire' ? renderSecondaryTable(data) : renderPrimaryTable(data)}
        {data.level === 'secondaire' ? <SecondaryFooter data={data} /> : <PrimaryFooter data={data} />}
        
      </Page>
  )
}

export function BulletinDocument({ data }: { data: BulletinData }) {
  return (
    <Document>
      <BulletinPage data={data} />
    </Document>
  )
}
