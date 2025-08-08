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
import PerformanceDashboardPage from './pages/analytics/Dashboard'
import ExerciseProgressPage from './pages/analytics/ExerciseProgress'
import VolumeAnalysisPage from './pages/analytics/VolumeAnalysis'
import HabitsPage from './pages/analytics/Habits'
import PRsPage from './pages/analytics/PRs'
import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { ModalProvider } from '@/context/ModalContext'
import { Toaster } from 'sonner'

// Register SW only in production to avoid interfering with Vite dev/HMR
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        navigator.serviceWorker.addEventListener('message', async (event) => {
          if (event.data?.type === 'SYNC_SETS') {
            // Defer to session page listeners if needed
          }
        })
        return reg
      })
      .catch(() => { })
  })
}

// In development, proactively unregister any existing SW from previous sessions
if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister())
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
                path="analytics"
                element={
                  <RequireAuth>
                    <PerformanceDashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="analytics/exercise"
                element={
                  <RequireAuth>
                    <ExerciseProgressPage />
                  </RequireAuth>
                }
              />
              <Route
                path="analytics/volume"
                element={
                  <RequireAuth>
                    <VolumeAnalysisPage />
                  </RequireAuth>
                }
              />
              <Route
                path="analytics/habits"
                element={
                  <RequireAuth>
                    <HabitsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="analytics/prs"
                element={
                  <RequireAuth>
                    <PRsPage />
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
