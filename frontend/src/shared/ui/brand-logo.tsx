interface BrandLogoProps {
  variant?: 'sidebar' | 'auth';
  className?: string;
}

export function BrandLogo({ variant = 'sidebar', className = '' }: BrandLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="GameParty — Encontre sua party"
      className={`brand-logo brand-logo--${variant} ${className}`.trim()}
    />
  );
}
