import { createContext, useContext, useEffect, useState } from 'react';
import { productsApi } from '../api/products';

const SettingsContext = createContext(null);

const FALLBACK = {
  siteName: 'PlayBeat Digital',
  heroHeadline: 'DIGITAL HEAVEN',
  heroSubtitle: 'Games, AI tools, software, gift cards and premium subscriptions with instant delivery.',
  heroBadge: '',
  announcementBar: '',
  currency: 'PKR',
  whatsapp: '',
  telegram: '',
  email: '',
  cartEnabled: true,
  wishlistEnabled: true,
  maintenanceMode: false,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    productsApi
      .settings()
      .then((data) => setSettings({ ...FALLBACK, ...data }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
