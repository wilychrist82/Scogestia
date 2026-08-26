import { getAllSchools, toggleSchoolStatus, updateSchoolPlan } from '@/app/actions/super_admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, ShieldOff, ShieldAlert, CheckCircle } from 'lucide-react'

export default async function SuperAdminSchools() {
  const schools = await getAllSchools()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Écoles (Clients)</h1>
        <p className="text-gray-500">Gestion des abonnements et accès des écoles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des écoles inscrites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">École</th>
                  <th className="px-4 py-3">Localisation</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {school.name}
                      <div className="text-xs text-gray-500 font-normal">{school.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      {school.city || 'N/A'}, {school.country}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="uppercase text-[10px]">
                        {school.subscription_plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {school.subscription_status === 'active' ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Actif</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Suspendu</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form className="flex items-center justify-end gap-2">
                        <input type="hidden" name="schoolId" value={school.id} />
                        
                        {/* Modifier le Plan */}
                        <select 
                          name="newPlan" 
                          defaultValue={school.subscription_plan}
                          className="text-xs border-gray-300 rounded-md py-1 px-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                          title="Modifier le plan"
                        >
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                        <button 
                          formAction={async (formData) => {
                            'use server'
                            const id = formData.get('schoolId') as string
                            const plan = formData.get('newPlan') as string
                            await updateSchoolPlan(id, plan)
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Sauvegarder le plan"
                        >
                          <Settings size={16} />
                        </button>

                        {/* Bloquer / Débloquer */}
                        <button 
                          formAction={async () => {
                            'use server'
                            await toggleSchoolStatus(school.id, school.subscription_status)
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            school.subscription_status === 'active' 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={school.subscription_status === 'active' ? "Suspendre l'école" : "Réactiver l'école"}
                        >
                          {school.subscription_status === 'active' ? <ShieldOff size={16} /> : <CheckCircle size={16} />}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
