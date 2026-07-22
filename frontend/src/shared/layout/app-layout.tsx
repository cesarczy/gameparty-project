import { Link, useLocation } from 'react-router-dom';
import type { Category } from '../../shared/api/client';
import { useAuth } from '../../app/auth-context';
import { BrandLogo, Button, GameSearchBox } from '../ui';

interface AppLayoutProps {
  children: React.ReactNode;
  categories?: Category[];
  selectedCategory?: string | null;
  onSelectCategory?: (id: string) => void;
}

export function AppLayout({
  children,
  categories = [],
  selectedCategory,
  onSelectCategory,
}: AppLayoutProps) {
  const { token, displayName, avatarUrl, isAdmin, logout } = useAuth();
  const location = useLocation();
  const showCategories = categories.length > 0 && onSelectCategory;
  const isAccountPage = location.pathname.startsWith('/conta');
  const showGameSearch = location.pathname === '/';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Link to="/" className="brand-link" aria-label="GameParty — início">
            <BrandLogo variant="sidebar" />
          </Link>
        </div>

        <div className="sidebar-divider" aria-hidden />

        <nav className="sidebar-nav">
          {showGameSearch && (
            <div className="sidebar-search-wrap">
              <p className="sidebar-label">Buscar</p>
              <GameSearchBox />
            </div>
          )}
          {isAdmin && (
            <Link to="/admin" className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              <span className="sidebar-link-icon" aria-hidden />
              Administração
            </Link>
          )}
        </nav>

        {showCategories && !isAccountPage && (
          <div className="sidebar-section">
            <p className="sidebar-label">Categorias · {categories.length}</p>
            <ul className="category-list">
              {categories.map((c) => (
                <li key={c.categoryId}>
                  <button
                    type="button"
                    className={`category-item ${selectedCategory === c.categoryId ? 'active' : ''}`}
                    onClick={() => onSelectCategory(c.categoryId)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="sidebar-footer">
          {!token ? (
            <div className="sidebar-auth">
              <Link to="/login"><Button variant="ghost" className="w-full">Entrar</Button></Link>
              <Link to="/register"><Button className="w-full">Registrar</Button></Link>
            </div>
          ) : (
            <div className="user-card">
              <div className="user-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" />
                ) : (
                  <span>{displayName?.slice(0, 1).toUpperCase() ?? '?'}</span>
                )}
              </div>
              <div className="user-meta">
                <Link
                  to="/conta"
                  className={`user-name-link ${location.pathname === '/conta' ? 'active' : ''}`}
                >
                  {displayName}
                </Link>
                <Link to="/conta" className="account-link muted small">
                  Minha conta
                </Link>
              </div>
              <Button variant="ghost" className="btn-sm" onClick={logout}>Sair</Button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
