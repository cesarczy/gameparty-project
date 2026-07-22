import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppRouter } from './app/router';
import './styles.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || 'missing-client-id'}>
      <AppRouter />
    </GoogleOAuthProvider>
  </StrictMode>,
);
