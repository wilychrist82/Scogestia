import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Mentions Légales - Scogestia',
  description: 'Mentions légales et informations éditoriales de l\'application Scogestia.',
};

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/" className="inline-flex items-center text-[#006039] hover:underline mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Mentions Légales</h1>
        
        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-[#006039]">
          <p className="text-slate-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Éditeur du site</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            L'application web <strong>Scogestia</strong> est éditée et gérée par l'équipe de développement Scogestia, basée à Lomé, Togo.
            <br />
            <strong>Siège social :</strong> Lomé - Togo
            <br />
            <strong>Contact :</strong> contact@scogestia.com
            <br />
            <strong>Téléphone / WhatsApp :</strong> +228 92 10 28 68
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Propriété Intellectuelle</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            L'ensemble des éléments constituant l'application Scogestia (textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de données, etc.) ainsi que le site lui-même, relèvent des législations togolaises et internationales sur les droits d'auteur et la propriété intellectuelle.
          </p>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Ces éléments sont la propriété exclusive de Scogestia, sauf mentions contraires. Toute représentation, reproduction, modification, utilisation commerciale, ainsi que tout transfert vers un autre site sont interdits, sauf autorisation expresse et écrite de l'éditeur.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Hébergement</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            L'application Scogestia est hébergée sur l'infrastructure Cloud de Vercel Inc. et Supabase.
            <br />
            <strong>Vercel Inc.</strong> : 340 S Lemon Ave #4133 Walnut, CA 91789, USA.
            <br />
            <strong>Supabase Inc.</strong> : 972 Mission St, San Francisco, CA 94103, USA.
            <br />
            Ces fournisseurs garantissent les plus hauts standards de sécurité (certifications SOC2, ISO 27001) pour la protection de vos données.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Limitation de responsabilité</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            L'éditeur s'efforce d'assurer au mieux de ses possibilités, l'exactitude et la mise à jour des informations diffusées sur Scogestia. Toutefois, il ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site. L'utilisation des informations et contenus disponibles sur l'ensemble du site ne saurait en aucun cas engager la responsabilité de l'éditeur.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Protection des données personnelles</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            Les informations recueillies via notre plateforme sont soumises à notre <Link href="/confidentialite" className="underline font-medium">Politique de Confidentialité</Link>. Conformément aux réglementations en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant.
          </p>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-slate-500 text-sm text-center">
              © {new Date().getFullYear()} Scogestia. Tous droits réservés. La gestion scolaire simplifiée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
