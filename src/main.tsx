import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'

import { lazy, Suspense } from 'react'
const LoginPage = lazy(() => import('./pages/login'))
const TreinoPage = lazy(() => import('./pages/treino'))
const TemplatesPage = lazy(() => import('./pages/templates/list'))
const TemplateEditorPage = lazy(() => import('./pages/templates/editor'))
const SessionPage = lazy(() => import('./pages/session'))
const HistoryPage = lazy(() => import('./pages/history'))
const SettingsPage = lazy(() => import('./pages/settings'))
const PerformanceDashboardPage = lazy(() => import('./pages/analytics/Dashboard'))
const ExerciseProgressPage = lazy(() => import('./pages/analytics/ExerciseProgress'))
const VolumeAnalysisPage = lazy(() => import('./pages/analytics/VolumeAnalysis'))
const HabitsPage = lazy(() => import('./pages/analytics/Habits'))
const PRsPage = lazy(() => import('./pages/analytics/PRs'))
import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { ModalProvider } from '@/context/ModalContext'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
// import { ErrorBoundary } from '@/components/guards/ErrorBoundary'

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModalProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />}>
                <Route index element={<Navigate to="/treino" replace />} />
                <Route path="login" element={<Suspense fallback={null}><LoginPage /></Suspense>} />
                <Route
                  path="treino"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><TreinoPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="templates"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><TemplatesPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="templates/:id"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><TemplateEditorPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="session/:templateId"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><SessionPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="history"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><HistoryPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><PerformanceDashboardPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="analytics/exercise"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><ExerciseProgressPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="analytics/volume"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><VolumeAnalysisPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="analytics/habits"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><HabitsPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="analytics/prs"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><PRsPage /></Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <RequireAuth>
                      <Suspense fallback={null}><SettingsPage /></Suspense>
                    </RequireAuth>
                  }
                />
              </Route>
            </Routes>
            <Toaster richColors position="top-right" />
          </BrowserRouter>
        </ModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
