import { GoogleLogin } from '@react-oauth/google';
import { api } from '../../../shared/api/client';
import { useAuth } from '../../../app/auth-context';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '../../../shared/ui';
import { useState } from 'react';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignInButton() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  if (!clientId) {
    return (
      <p className="muted small">
        Configure <code>VITE_GOOGLE_CLIENT_ID</code> para login com Google.
      </p>
    );
  }

  return (
    <div className="google-auth">
      {error && <ErrorState message={error} />}
      <GoogleLogin
        onSuccess={async (res) => {
          if (!res.credential) return;
          setError(null);
          try {
            const auth = await api.googleLogin(res.credential);
            login({
              token: auth.token,
              playerId: auth.playerId,
              displayName: auth.displayName,
              role: auth.role,
              avatarUrl: auth.avatarUrl,
            });
            navigate('/');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Erro no Google');
          }
        }}
        onError={() => setError('Login Google cancelado ou falhou')}
        theme="filled_black"
        size="large"
        text="continue_with"
        shape="rectangular"
        locale="pt-BR"
      />
    </div>
  );
}
