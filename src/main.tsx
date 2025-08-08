import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'

import LoginPage from './pages/login'
import TreinoPage from './pages/treino'
import TemplatesPage from './pages/templates/list'
import TemplateEditorPage from './pages/templates/editor'
import SessionPage from './pages/session'
import HistoryPage from './pages/history'
import SettingsPage from './pages/settings'
import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { ModalProvider } from '@/context/ModalContext'
import { Toaster } from 'sonner'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data?.type === 'SYNC_SETS') {
          // Defer to session page listeners if needed
        }
      })
      return reg
    }).catch(() => { })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<Navigate to="/treino" replace />} />
              <Route path="login" element={<LoginPage />} />
              <Route
                path="treino"
                element={
                  <RequireAuth>
                    <TreinoPage />
                  </RequireAuth>
                }
              />
              <Route
                path="templates"
                element={
                  <RequireAuth>
                    <TemplatesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="templates/:id"
                element={
                  <RequireAuth>
                    <TemplateEditorPage />
                  </RequireAuth>
                }
              />
              <Route
                path="session/:templateId"
                element={
                  <RequireAuth>
                    <SessionPage />
                  </RequireAuth>
                }
              />
              <Route
                path="history"
                element={
                  <RequireAuth>
                    <HistoryPage />
                  </RequireAuth>
                }
              />
              <Route
                path="settings"
                element={
                  <RequireAuth>
                    <SettingsPage />
                  </RequireAuth>
                }
              />
            </Route>
          </Routes>
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  </StrictMode>,
)
