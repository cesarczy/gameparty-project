import { Link } from 'react-router-dom';

interface BackLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

function BackChevron() {
  return (
    <svg className="back-link-icon" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackLink({ to, children, className = '' }: BackLinkProps) {
  return (
    <Link to={to} className={`back-link ${className}`.trim()}>
      <BackChevron />
      <span>{children}</span>
    </Link>
  );
}
