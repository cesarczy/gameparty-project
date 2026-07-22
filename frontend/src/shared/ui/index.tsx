export { GameSearchBox } from './game-search-box';
export { BrandLogo } from './brand-logo';
export { NotificationsPanel } from './notifications-panel';
export { GameCover } from './game-cover';
export { PlayerNick } from './player-nick';
export { RankBadge } from './rank-badge';
export { PasswordInput } from './password-input';
export { BackLink } from './back-link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'btn';
  const styles = variant === 'primary' ? 'btn-primary' : 'btn-ghost';
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`.trim()} {...props} />;
}

export function Label({
  children,
  htmlFor,
  className = '',
}: {
  children: React.ReactNode;
  htmlFor: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={`label ${className}`}>
      {children}
    </label>
  );
}

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Carregando" />;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="empty">{message}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return <p className="error" role="alert">{message}</p>;
}
