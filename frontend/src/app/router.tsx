import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth-context';
import { GlobalNotifications } from './global-notifications';
import { AdminRoute, ProtectedRoute } from './protected-route';
import { LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from '../features/auth/pages/auth-pages';
import { TermsPage } from '../features/legal/pages/terms-page';
import { LobbyPage } from '../features/lobby/pages/lobby-page';
import { GameLobbyRedirectPage } from '../features/lobby/pages/game-lobby-redirect';
import { ProfilePage } from '../features/profile/pages/profile-page';
import { AdminPage } from '../features/admin/pages/admin-page';
import { RoomPage, DmPage, PublicProfilePage } from '../features/room/pages/room-page';

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalNotifications />
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/verificar-email" element={<VerifyEmailPage />} />
          <Route path="/conta" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/salas/:roomId" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
          <Route path="/mensagens/:peerId" element={<ProtectedRoute><DmPage /></ProtectedRoute>} />
          <Route path="/jogadores/:playerId" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
          <Route path="/jogos/:slug/lobby" element={<ProtectedRoute><GameLobbyRedirectPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
