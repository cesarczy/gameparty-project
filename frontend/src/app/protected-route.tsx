import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';
import { Spinner } from '../shared/ui';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, sessionReady } = useAuth();
  const location = useLocation();

  if (!sessionReady) {
    return (
      <div className="content-loading">
        <Spinner />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, isAdmin, sessionReady } = useAuth();

  if (!sessionReady) {
    return (
      <div className="content-loading">
        <Spinner />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AuthLoading({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  if (loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }
  return <>{children}</>;
}
