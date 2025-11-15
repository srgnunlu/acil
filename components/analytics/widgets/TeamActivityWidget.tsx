'use client'

import { Users, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface TeamMember {
  user_id: string
  user_name: string
  user_role: string
  patients_managed: number
  last_activity: string | null
}

interface TeamActivityWidgetProps {
  members: TeamMember[]
}

const roleLabels: Record<string, string> = {
  owner: 'Sahip',
  admin: 'Yönetici',
  senior_doctor: 'Kıdemli Doktor',
  doctor: 'Doktor',
  resident: 'Asistan',
  nurse: 'Hemşire',
  observer: 'Gözlemci',
}

export function TeamActivityWidget({ members }: TeamActivityWidgetProps) {
  const activeMembers = members.filter(
    (m) => m.last_activity && new Date(m.last_activity) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  )

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Ekip Aktivitesi</h3>
        <Users className="w-6 h-6 text-green-400" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-gray-700">
        <div>
          <p className="text-xs text-gray-400 mb-1">Toplam Üye</p>
          <p className="text-2xl font-bold text-gray-100">{members.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Aktif (24s)</p>
          <p className="text-2xl font-bold text-green-400">{activeMembers.length}</p>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {members.map((member) => {
          const isActive = member.last_activity && new Date(member.last_activity) > new Date(Date.now() - 24 * 60 * 60 * 1000)

          return (
            <div
              key={member.user_id}
              className="p-3 rounded-lg bg-gray-900/50 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className="font-medium text-gray-200">{member.user_name}</span>
                </div>
                <span className="text-xs text-gray-500">{roleLabels[member.user_role] || member.user_role}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-gray-400">
                  <Activity className="w-3 h-3" />
                  <span>{member.patients_managed} hasta</span>
                </div>
                {member.last_activity && (
                  <span className="text-gray-500">
                    {formatDistanceToNow(new Date(member.last_activity), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
