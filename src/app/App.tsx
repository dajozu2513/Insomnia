import { RouterProvider } from 'react-router-dom';

import { LanguageProvider } from '../i18n';
import { router } from './router';

export function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
