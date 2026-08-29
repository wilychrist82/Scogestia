import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Conditions d\'utilisation - Scogestia',
  description: 'Conditions générales d\'utilisation de l\'application Scogestia.',
};

export default function ConditionsUtilisation() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/" className="inline-flex items-center text-[#006039] hover:underline mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Conditions Générales d'Utilisation</h1>
        
        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-[#006039]">
          <p className="text-slate-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptation des conditions</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            En accédant et en utilisant l'application web Scogestia (ci-après "le Service"), vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre Service.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description du Service</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Scogestia est une plateforme SaaS (Software as a Service) destinée à la gestion scolaire. Elle permet aux directeurs, comptables, enseignants et parents de gérer et suivre les activités académiques et financières d'un établissement scolaire (notes, paiements, emplois du temps, etc.).
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Accès au Service et Inscription</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Pour utiliser Scogestia, l'établissement doit créer un compte. Les informations fournies lors de l'inscription doivent être exactes et à jour. L'utilisateur est responsable de la sécurité de ses identifiants de connexion. Toute activité effectuée sous un compte est considérée comme ayant été effectuée par le titulaire du compte.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Propriété des données</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Les données saisies dans Scogestia par un établissement (informations des élèves, notes, données financières) restent la propriété exclusive de cet établissement. Scogestia agit uniquement en tant que sous-traitant pour stocker et traiter ces données conformément aux instructions de l'établissement.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Disponibilité et Maintenance</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Nous nous efforçons de maintenir le Service accessible 24h/24 et 7j/7. Toutefois, l'accès peut être temporairement suspendu pour des raisons de maintenance, de mises à jour ou en cas de force majeure, sans que cela n'ouvre droit à une quelconque indemnisation.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Tarification et Paiements</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            L'utilisation du Service est soumise au paiement d'un abonnement tel que décrit sur notre page des tarifs. Le défaut de paiement peut entraîner la suspension ou la résiliation du compte après notification préalable.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Résiliation</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Un établissement peut résilier son abonnement à tout moment. En cas de résiliation, les données de l'établissement pourront être exportées avant la fermeture définitive du compte, conformément à notre politique de conservation des données.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Modification des conditions</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Scogestia se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés de toute modification substantielle. Continuer à utiliser le Service après ces modifications vaut acceptation des nouvelles conditions.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Pour toute question concernant ces conditions, veuillez nous contacter via la page d'accueil ou au numéro WhatsApp indiqué sur la plateforme.
          </p>
        </div>
      </div>
    </div>
  );
}
