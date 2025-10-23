import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../authentication/ProtectedRoute'
import { AppLayout } from '../components/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { SessionDetailPage } from '../pages/SessionDetailPage'
import { SessionFormPage } from '../pages/SessionFormPage'
import { GameLibraryPage } from '../pages/GameLibraryPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sessions/new" element={<SessionFormPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/sessions/:id/edit" element={<SessionFormPage />} />
          <Route path="/games" element={<GameLibraryPage />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes

