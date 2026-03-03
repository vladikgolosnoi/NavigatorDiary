import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { ScreenPage } from './screens/ScreenPage'
import { screenConfigs } from './state/navigation'
import { LAST_STATE_KEY, LastState } from './state/lastState'
import { AuthTeamPage } from './screens/AuthTeamPage'
import { AuthUserPage } from './screens/AuthUserPage'
import { HomePage } from './screens/HomePage'
import { ProfilePage } from './screens/ProfilePage'
import { GoalsCatalogPage } from './screens/GoalsCatalogPage'
import { SpecialtiesCatalogPage } from './screens/SpecialtiesCatalogPage'
import { MyGoalsPage } from './screens/MyGoalsPage'
import { MySpecialtiesPage } from './screens/MySpecialtiesPage'
import { MyAchievementsPage } from './screens/MyAchievementsPage'
import { BeaverHutPage } from './screens/BeaverHutPage'
import { ChatPage } from './screens/ChatPage'
import { ExtraPage } from './screens/ExtraPage'
import { AuthProvider } from './state/auth'
import { RequireAuth } from './components/RequireAuth'
import { RequireRole } from './components/RequireRole'
import { OrganizerDashboardPage } from './screens/OrganizerDashboardPage'
import { LeaderDashboardPage } from './screens/LeaderDashboardPage'

function RootRedirect() {
  let target = '/home'
  const allowedPaths = new Set(screenConfigs.map((screen) => screen.path))
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(LAST_STATE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as LastState
        if (parsed?.path && parsed.path !== '/' && allowedPaths.has(parsed.path)) {
          target = parsed.path
        }
      }
    } catch {
      target = '/home'
    }
  }
  return <Navigate to={target} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth/team" element={<AuthTeamPage />} />
            <Route path="/auth/user" element={<AuthUserPage />} />
            <Route path="/goals" element={<Navigate to="/goals/my" replace />} />
            <Route path="/specialties" element={<Navigate to="/specialties/my" replace />} />
            {screenConfigs.map((screen) => {
              if (screen.path === '/home') {
                return <Route key={screen.path} path={screen.path} element={<HomePage />} />
              }
              if (screen.path === '/profile') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireAuth>
                        <ProfilePage />
                      </RequireAuth>
                    }
                  />
                )
              }
              if (screen.path === '/goals/catalog') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireRole roles={['NAVIGATOR']}>
                        <GoalsCatalogPage />
                      </RequireRole>
                    }
                  />
                )
              }
              if (screen.path === '/goals/my') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireRole roles={['NAVIGATOR']}>
                        <MyGoalsPage />
                      </RequireRole>
                    }
                  />
                )
              }
              if (screen.path === '/specialties/catalog') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireRole roles={['NAVIGATOR']}>
                        <SpecialtiesCatalogPage />
                      </RequireRole>
                    }
                  />
                )
              }
              if (screen.path === '/specialties/my') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireRole roles={['NAVIGATOR']}>
                        <MySpecialtiesPage />
                      </RequireRole>
                    }
                  />
                )
              }
              if (screen.path === '/achievements') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireRole roles={['NAVIGATOR']}>
                        <MyAchievementsPage />
                      </RequireRole>
                    }
                  />
                )
              }
              if (screen.path === '/beaver-hut') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireRole roles={['NAVIGATOR', 'ORGANIZER']}>
                        <BeaverHutPage />
                      </RequireRole>
                    }
                  />
                )
              }
              if (screen.path === '/chat') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireRole roles={['NAVIGATOR', 'LEADER']}>
                        <ChatPage />
                      </RequireRole>
                    }
                  />
                )
              }
              if (screen.path === '/extra') {
                return <Route key={screen.path} path={screen.path} element={<ExtraPage />} />
              }
              if (screen.path === '/organizer') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireRole roles={['ORGANIZER']}>
                        <OrganizerDashboardPage />
                      </RequireRole>
                    }
                  />
                )
              }
              if (screen.path === '/leader') {
                return (
                  <Route
                    key={screen.path}
                    path={screen.path}
                    element={
                      <RequireRole roles={['LEADER']}>
                        <LeaderDashboardPage />
                      </RequireRole>
                    }
                  />
                )
              }
              return <Route key={screen.path} path={screen.path} element={<ScreenPage {...screen} />} />
            })}
            <Route
              path="*"
              element={
                <ScreenPage
                  path="*"
                  title="Экран не найден"
                  description="Проверьте адрес или выберите раздел в меню сверху."
                  badges={["Навигация", "Подсказка", "Возврат"]}
                />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
