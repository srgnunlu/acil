import { Metadata } from 'next'
import { PWASettingsClient } from './PWASettingsClient'

export const metadata: Metadata = {
  title: 'PWA Ayarları',
  description: 'Progressive Web App ayarlarını yönetin',
}

export default function PWASettingsPage() {
  return <PWASettingsClient />
}
