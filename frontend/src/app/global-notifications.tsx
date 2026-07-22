import { useAuth } from './auth-context';
import { NotificationsPanel } from '../shared/ui';

export function GlobalNotifications() {
  const { token } = useAuth();
  if (!token) return null;
  return <NotificationsPanel variant="fixed" />;
}
