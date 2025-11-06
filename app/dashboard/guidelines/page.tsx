export default function GuidelinesPage() {
  const guidelines = [
    {
      id: 1,
      title: 'Akut Koroner Sendrom Yönetimi',
      category: 'Kardiyoloji',
      description: 'AKS hastalarında tanı ve tedavi algoritması',
      icon: '❤️',
    },
    {
      id: 2,
      title: 'Sepsis ve Septik Şok',
      category: 'Enfeksiyon',
      description: 'Sepsis-3 kriterleri ve erken yönetim',
      icon: '🦠',
    },
    {
      id: 3,
      title: 'Akut İnme Protokolü',
      category: 'Nöroloji',
      description: 'İskemik ve hemorajik inme acil yaklaşımı',
      icon: '🧠',
    },
    {
      id: 4,
      title: 'Travma Resüsitasyonu',
      category: 'Travma',
      description: 'ATLS protokolü ve ilk 24 saat yönetimi',
      icon: '🚑',
    },
    {
      id: 5,
      title: 'Akut Solunum Yetmezliği',
      category: 'Solunum',
      description: 'Oksijen tedavisi ve mekanik ventilasyon',
      icon: '🫁',
    },
    {
      id: 6,
      title: 'Anafılaksi Yönetimi',
      category: 'Alerji',
      description: 'Erken tanı ve adrenalin protokolü',
      icon: '💉',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Kılavuzlar ve Algoritmalar
        </h1>
        <p className="text-gray-600">
          Acil serviste sık karşılaşılan durumlar için güncel kılavuzlar
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guidelines.map((guideline) => (
          <div
            key={guideline.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-4xl mb-4">{guideline.icon}</div>
            <div className="mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                {guideline.category}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {guideline.title}
            </h3>
            <p className="text-sm text-gray-600">{guideline.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          📚 Yakında Daha Fazlası
        </h3>
        <p className="text-gray-700">
          Kılavuz kütüphanemiz sürekli güncellenmektedir. Öneri ve
          istekleriniz için bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  )
}
