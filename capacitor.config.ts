import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scogestia.app',
  appName: 'Scogestia',
  webDir: 'public',
  server: {
    url: 'https://scogestia.vercel.app',
    cleartext: true
  }
};

export default config;
