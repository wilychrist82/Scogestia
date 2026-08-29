import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Politique de Confidentialité - Scogestia',
  description: 'Politique de confidentialité et protection des données personnelles.',
};

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/" className="inline-flex items-center text-[#006039] hover:underline mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Politique de Confidentialité</h1>
        
        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-[#006039]">
          <p className="text-slate-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Chez Scogestia, la protection de vos données personnelles et de celles de vos élèves est notre priorité absolue. Cette politique de confidentialité explique quelles informations nous collectons, comment nous les utilisons, et comment nous assurons leur sécurité.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Données collectées</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Dans le cadre de l'utilisation de notre plateforme, nous pouvons être amenés à collecter et traiter les données suivantes :
          </p>
          <ul className="list-disc pl-6 mb-4 text-slate-700 leading-relaxed">
            <li><strong>Données d'identification de l'établissement</strong> : Nom, adresse, contacts administratifs.</li>
            <li><strong>Données des utilisateurs</strong> : Noms, prénoms, adresses e-mail et mots de passe cryptés des directeurs, enseignants, comptables et parents.</li>
            <li><strong>Données scolaires</strong> : Informations sur les élèves (nom, prénom, classe, date de naissance), notes, bulletins, absences et historiques de paiement de scolarité.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Utilisation des données</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Les données collectées sont utilisées exclusivement pour :
          </p>
          <ul className="list-disc pl-6 mb-4 text-slate-700 leading-relaxed">
            <li>Fournir, gérer et améliorer les services de gestion scolaire de Scogestia.</li>
            <li>Permettre la communication entre l'établissement, les enseignants et les parents.</li>
            <li>Générer des documents administratifs (bulletins, reçus de paiement).</li>
            <li>Assurer le support technique et répondre à vos demandes.</li>
          </ul>
          <p className="mb-4 text-slate-700 leading-relaxed font-medium">
            Scogestia ne revendra et ne partagera jamais vos données personnelles à des tiers à des fins publicitaires.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Hébergement et Sécurité</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Toutes les données sont hébergées sur des serveurs Cloud sécurisés avec des bases de données isolées pour chaque établissement. Nous utilisons des protocoles de cryptage avancés (SSL/HTTPS) pour le transfert des données et le hachage sécurisé pour les mots de passe. Des sauvegardes régulières sont effectuées pour prévenir toute perte de données.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Droits des utilisateurs</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Conformément aux lois sur la protection des données, chaque utilisateur dispose d'un droit d'accès, de rectification, de suppression et de portabilité de ses données. Les parents ou élèves souhaitant exercer ces droits doivent d'abord s'adresser à la direction de leur établissement scolaire (qui est le responsable du traitement des données).
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookies</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Scogestia utilise des cookies strictement nécessaires au fonctionnement technique de l'application (comme le maintien de votre session de connexion). Nous n'utilisons pas de cookies de traçage publicitaire intrusifs.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contactez-nous</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Si vous avez des questions ou des préoccupations concernant notre politique de confidentialité ou la gestion de vos données, veuillez nous contacter via WhatsApp au numéro fourni sur la page d'accueil ou par e-mail à contact@scogestia.com.
          </p>
        </div>
      </div>
    </div>
  );
}
