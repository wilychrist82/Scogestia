import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Configuration minimale pour rester sous les 300Ko. On utilise les polices standard incluses dans pdfkit (Helvetica, Times).
// Si besoin d'un look spécifique, on pourrait importer une police, mais ça augmente le poids.
// Helvetica est le défaut.

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0b1c30', // on-surface
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#6f7973',
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  schoolName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#004532', // primary
  },
  schoolDetails: {
    fontSize: 9,
    color: '#545f73',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  term: {
    fontSize: 10,
    color: '#545f73',
  },
  studentInfo: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f9ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dce9ff',
  },
  studentName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#6f7973',
    borderRadius: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#004532',
    color: 'white',
    padding: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#d3e4fe',
    padding: 5,
  },
  colSubject: { width: '25%' },
  colCoef: { width: '10%', textAlign: 'center' },
  colScore: { width: '15%', textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  colWeighted: { width: '15%', textAlign: 'center' },
  colComment: { width: '35%', paddingLeft: 5, fontSize: 8 },
  summaryBox: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#004532',
    backgroundColor: '#f8f9ff',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#545f73',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#004532',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#d3e4fe',
    paddingTop: 10,
  }
})

type Grade = {
  subject_name: string
  score: number
  max_score: number
}

type Props = {
  student: {
    first_name: string
    last_name: string
  }
  term: string
  termSummary: {
    term_average: number
    class_rank: number
  } | null
  grades: Grade[]
}

// Fonction utilitaire pour générer une appréciation basée sur la note (sur 20)
function getAppreciation(score20: number) {
  if (score20 >= 16) return "Très bon travail. Félicitations."
  if (score20 >= 14) return "Bon trimestre, continuez ainsi."
  if (score20 >= 12) return "Résultats satisfaisants."
  if (score20 >= 10) return "Ensemble moyen. Des efforts sont attendus."
  if (score20 >= 8) return "Résultats insuffisants. Il faut travailler davantage."
  return "Très insuffisant. Mise en garde."
}

export function BulletinDocument({ student, term, termSummary, grades }: Props) {
  // Agrégation et calculs pour affichage
  const rows = grades.map(g => {
    const score20 = (g.score / g.max_score) * 20
    const coef = 1 // Dans un vrai système, la table grades ou subject aurait un coef
    const weighted = score20 * coef
    return {
      subject: g.subject_name,
      score: score20.toFixed(2),
      coef: coef,
      weighted: weighted.toFixed(2),
      comment: getAppreciation(score20)
    }
  })

  const year = new Date().getFullYear()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.schoolName}>EduParent Togo</Text>
            <Text style={styles.schoolDetails}>Excellence et Rigueur</Text>
            <Text style={styles.schoolDetails}>Lomé, Togo</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>BULLETIN TRIMESTRIEL</Text>
            <Text style={styles.term}>{term} - Année {year-1}/{year}</Text>
          </View>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>Élève : {student.first_name} {student.last_name}</Text>
          <Text>Statut : Inscrit</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colSubject}>Matière</Text>
            <Text style={styles.colCoef}>Coef.</Text>
            <Text style={styles.colScore}>Note /20</Text>
            <Text style={styles.colWeighted}>N. Pondérée</Text>
            <Text style={styles.colComment}>Appréciation</Text>
          </View>

          {rows.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colSubject}>{row.subject}</Text>
              <Text style={styles.colCoef}>{row.coef}</Text>
              <Text style={styles.colScore}>{row.score}</Text>
              <Text style={styles.colWeighted}>{row.weighted}</Text>
              <Text style={styles.colComment}>{row.comment}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Moyenne Générale</Text>
            <Text style={styles.summaryValue}>{termSummary ? termSummary.term_average.toFixed(2) : '-'} / 20</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Rang dans la classe</Text>
            <Text style={styles.summaryValue}>{termSummary ? `${termSummary.class_rank}e` : '-'}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document généré numériquement par EduParent Togo. La direction.
        </Text>
      </Page>
    </Document>
  )
}
