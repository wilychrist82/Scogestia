import { getAllSchools } from '@/app/actions/super_admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SchoolRowActions } from '@/components/super_admin/SchoolRowActions'

export const dynamic = 'force-dynamic'

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
                  <th className="px-4 py-3">Échéance</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school: any) => {
                  const subRaw = school.saas_subscriptions
                  const sub = Array.isArray(subRaw) ? subRaw[0] : subRaw
                  const endDate = sub?.current_period_end ? new Date(sub.current_period_end) : null
                  const isExpired = endDate ? endDate < new Date() : school.subscription_status !== 'active'

                  return (
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
                      <td className="px-4 py-3 text-xs">
                        {endDate ? (
                          <span className={isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                            {endDate.toLocaleDateString('fr-FR')} {isExpired && '(Expiré)'}
                          </span>
                        ) : (
                          <span className="text-gray-400">Non définie</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isExpired && school.subscription_status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Actif</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Suspendu</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <SchoolRowActions 
                          schoolId={school.id}
                          currentPlan={school.subscription_plan}
                          currentStatus={school.subscription_status}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
