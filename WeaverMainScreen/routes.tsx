import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import TaleWeaverSetupPage from './tw/TaleWeaverSetupPage.tsx';
import TaleWeaverStudioPage from './tw/TaleWeaverStudioPage.tsx';
import DocumentEditorHost from './components/DocumentEditorHost';

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/tale-weaver/setup', element: <TaleWeaverSetupPage /> },
  { path: '/tale-weaver/studio', element: <TaleWeaverStudioPage /> },
  { path: '/doc-editor', element: <DocumentEditorHost /> },
]);

export default router;