import { createBrowserRouter } from 'react-router-dom';

import { Layout } from '../components/layout/Layout';
import { ArticlePage } from '../pages/ArticlePage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  // Sources of the share image and the icons (captured to files; not linked, noindex).
  {
    path: 'brand-assets/:asset',
    lazy: async () => {
      const { BrandAssetPage } = await import('../pages/brand/BrandAssetPage');
      return { Component: BrandAssetPage };
    },
  },
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      // Readings: the same slug in both languages; unknown slugs render the 404 page.
      { path: 'lecturas/:slug', element: <ArticlePage /> },
      // Internal design lab: not linked anywhere, noindex, loaded on demand.
      {
        path: 'lab',
        lazy: async () => {
          const { LabPage } = await import('../pages/lab/LabPage');
          return { Component: LabPage };
        },
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
