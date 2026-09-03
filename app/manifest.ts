import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Scogestia',
    short_name: 'Scogestia',
    description: 'La gestion scolaire simplifiée',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f19',
    theme_color: '#005841',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
