import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type FriendSummary, type UserProfile } from '../../../shared/api/client';
import { useAuth } from '../../../app/auth-context';
import { AppLayout } from '../../../shared/layout/app-layout';
import { Button, ErrorState, Input, Label, RankBadge, Spinner } from '../../../shared/ui';

type AccountSection = 'conta' | 'privacidade' | 'aparencia' | 'favoritos' | 'amigos' | 'bloqueados';

const NAV_ITEMS: Array<{ id: AccountSection; label: string; icon: string }> = [
  { id: 'conta', label: 'Conta', icon: '👤' },
  { id: 'privacidade', label: 'Chat e privacidade', icon: '🔒' },
  { id: 'aparencia', label: 'Aparência', icon: '🎨' },
  { id: 'favoritos', label: 'Jogos favoritos', icon: '★' },
  { id: 'amigos', label: 'Amigos', icon: '👥' },
  { id: 'bloqueados', label: 'Bloqueados', icon: '🚫' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 4))}@${domain}`;
}

function FieldHint({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="field-error" role="alert">
      {message}
    </p>
  );
}

function isSenhaAtualErrorMessage(message: string): boolean {
  return message.toLowerCase().includes('senha atual');
}

export function ProfilePage() {
  const { updateSession } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<AccountSection>('conta');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [emailSenha, setEmailSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaAtualError, setSenhaAtualError] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [pendingFriends, setPendingFriends] = useState<Array<{ requesterId: string; displayName: string }>>([]);
  const [blocked, setBlocked] = useState<Array<{ playerId: string; displayName: string }>>([]);
  const [favoriteGames, setFavoriteGames] = useState<Array<{
    gameId: string;
    name: string;
    slug: string;
    lobbyRoomId: string | null;
  }>>([]);

  useEffect(() => {
    api.getProfile()
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName);
        setNovoEmail(p.email);
        setAvatarPreview(p.avatarUrl);
        setEmailSenha('');
        setSenhaAtual('');
        setSenhaNova('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      api.listFriends(),
      api.listPendingFriends(),
      api.listBlocked(),
    ])
      .then(([f, p, b]) => {
        setFriends(f.friends);
        setPendingFriends(p.requests);
        setBlocked(b.blocked);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!profile?.favoritos.length) {
      setFavoriteGames([]);
      return;
    }
    api.listCategories()
      .then(async (res) => {
        const games: Array<{ gameId: string; name: string; slug: string; lobbyRoomId: string | null }> = [];
        for (const cat of res.categories) {
          const listed = await api.listGamesByCategory(cat.categoryId);
          for (const g of listed.games) {
            if (profile.favoritos.includes(g.gameId)) {
              games.push({
                gameId: g.gameId,
                name: g.name,
                slug: g.slug,
                lobbyRoomId: g.lobbyRoomId,
              });
            }
          }
        }
        setFavoriteGames(games);
      })
      .catch(() => undefined);
  }, [profile?.favoritos]);

  function flash(msg: string) {
    setSuccess(msg);
    setError(null);
    setSenhaAtualError(null);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function saveDisplayName(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.updateProfile({ displayName });
      updateSession({ displayName: res.displayName, token: res.token });
      const p = await api.getProfile();
      setProfile(p);
      flash('Nome atualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.changeEmail({
        novoEmail,
        senhaAtual: profile?.hasPassword ? emailSenha : undefined,
      });
      const p = await api.getProfile();
      setProfile(p);
      setNovoEmail(p.email);
      setEmailSenha('');
      flash('E-mail atualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSenhaAtualError(null);
    try {
      await api.changePassword({
        senhaAtual: profile?.hasPassword ? senhaAtual : undefined,
        senhaNova,
      });
      setSenhaAtual('');
      setSenhaNova('');
      flash(profile?.hasPassword ? 'Senha alterada.' : 'Senha definida.');
      const p = await api.getProfile();
      setProfile(p);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro';
      if (profile?.hasPassword && isSenhaAtualErrorMessage(message)) {
        setSenhaAtualError(message);
        setError(null);
        document.getElementById('senhaAtual')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('senhaAtual')?.focus();
      } else {
        setError(message);
      }
    }
  }

  async function toggleSetting(key: 'profanityFilterEnabled' | 'chatOnline', value: boolean) {
    try {
      const res = await api.updateSettings({ [key]: value });
      setProfile((p) => p ? {
        ...p,
        profanityFilterEnabled: res.profanityFilterEnabled,
        chatOnline: res.chatOnline,
      } : p);
      flash(key === 'chatOnline' ? (value ? 'Você está online no chat.' : 'Você está offline no chat.') : 'Filtro de xingamentos atualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  async function saveThemeLanguage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const res = await api.updateSettings({
        theme: form.get('theme') as 'dark' | 'light',
        language: form.get('language') as 'pt-BR' | 'en-US' | 'es-ES',
      });
      setProfile((p) => p ? { ...p, theme: res.theme, language: res.language } : p);
      document.documentElement.dataset.theme = res.theme;
      flash('Configurações salvas.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  async function acceptFriend(requesterId: string) {
    await api.acceptFriend(requesterId);
    const [f, p] = await Promise.all([api.listFriends(), api.listPendingFriends()]);
    setFriends(f.friends);
    setPendingFriends(p.requests);
    flash('Amizade aceita.');
  }

  async function unblockPlayer(blockedId: string) {
    await api.unblockPlayer(blockedId);
    const b = await api.listBlocked();
    setBlocked(b.blocked);
    flash('Usuário desbloqueado.');
  }

  async function onAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadingAvatar(true);
    setAvatarPreview(URL.createObjectURL(file));

    try {
      const res = await api.updateAvatar(file);
      updateSession({ avatarUrl: res.avatarUrl });
      setAvatarPreview(res.avatarUrl);
      flash('Foto de perfil atualizada.');
    } catch (err) {
      setAvatarPreview(profile?.avatarUrl ?? null);
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto');
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="content-loading"><Spinner /></div>
      </AppLayout>
    );
  }

  const canChangeName = profile?.canChangeDisplayName ?? false;
  const canChangeEmailField = profile?.canChangeEmail ?? false;
  const activeLabel = NAV_ITEMS.find((item) => item.id === section)?.label ?? 'Conta';

  return (
    <AppLayout>
      <div className="account-settings">
        <aside className="account-settings-nav" aria-label="Configurações da conta">
          <div className="account-nav-profile">
            <div className="avatar-preview sm">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" />
              ) : (
                <span>{displayName.slice(0, 1)}</span>
              )}
            </div>
            <div className="account-nav-profile-meta">
              <strong>{displayName}</strong>
              {profile?.rank && (
                <RankBadge rank={profile.rank} className="muted small" />
              )}
            </div>
          </div>

          <p className="account-nav-label">Minha conta</p>
          <nav className="account-nav-list">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`account-nav-item ${section === item.id ? 'active' : ''}`}
                onClick={() => setSection(item.id)}
              >
                <span className="account-nav-icon" aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'amigos' && pendingFriends.length > 0 && (
                  <span className="account-nav-badge">{pendingFriends.length}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className="account-settings-content">
          <h1 className="account-section-title">{activeLabel}</h1>

          {error && <ErrorState message={error} />}
          {success && <p className="success-banner">{success}</p>}

          {section === 'conta' && (
            <>
              <section className="settings-group">
                <h2 className="settings-group-title">Informações da conta</h2>

                <div className="settings-row">
                  <div className="settings-row-main">
                    <span className="settings-row-label">Foto de perfil</span>
                    <div className="settings-avatar-row">
                      <div className="avatar-preview lg">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="" />
                        ) : (
                          <span>{displayName.slice(0, 1)}</span>
                        )}
                      </div>
                      <div>
                        <input
                          ref={fileRef}
                          id="avatarFile"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="sr-only"
                          onChange={onAvatarSelected}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="btn-sm"
                          disabled={uploadingAvatar}
                          onClick={() => fileRef.current?.click()}
                        >
                          {uploadingAvatar ? 'Enviando…' : 'Alterar foto'}
                        </Button>
                        <p className="muted small">JPG, PNG, WEBP ou GIF — máx. 2 MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-main">
                    <span className="settings-row-label">Nome de exibição</span>
                    <span className="settings-row-value">{displayName}</span>
                    {!canChangeName && profile?.nextDisplayNameChangeAt && (
                      <p className="muted small">
                        Próxima alteração em {formatDate(profile.nextDisplayNameChangeAt)} (a cada 20 dias).
                      </p>
                    )}
                  </div>
                </div>
                <form onSubmit={saveDisplayName} className="settings-form-block" autoComplete="off">
                  <Label htmlFor="displayName">Novo nome</Label>
                  <div className="settings-form-row">
                    <Input
                      id="displayName"
                      name="gp-display-name"
                      autoComplete="off"
                      required
                      minLength={2}
                      maxLength={32}
                      value={displayName}
                      disabled={!canChangeName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <Button type="submit" disabled={!canChangeName}>Salvar</Button>
                  </div>
                </form>

                <div className="settings-row">
                  <div className="settings-row-main">
                    <span className="settings-row-label">E-mail</span>
                    <span className="settings-row-value">
                      {showEmail ? profile?.email : maskEmail(profile?.email ?? '')}
                      {' '}
                      <button type="button" className="settings-link-btn" onClick={() => setShowEmail((v) => !v)}>
                        {showEmail ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </span>
                    {!canChangeEmailField && profile?.nextEmailChangeAt && (
                      <p className="muted small">
                        Próxima alteração em {formatDate(profile.nextEmailChangeAt)} (a cada 20 dias).
                      </p>
                    )}
                  </div>
                </div>
                <form onSubmit={saveEmail} className="settings-form-block" autoComplete="off">
                  <Label htmlFor="novoEmail">Novo e-mail</Label>
                  <Input
                    id="novoEmail"
                    name="gp-new-email"
                    type="email"
                    autoComplete="off"
                    required
                    value={novoEmail}
                    disabled={!canChangeEmailField}
                    onChange={(e) => setNovoEmail(e.target.value)}
                  />
                  {profile?.hasPassword && (
                    <>
                      <Label htmlFor="emailSenha">Senha atual</Label>
                      <Input
                        id="emailSenha"
                        name="gp-email-password"
                        type="password"
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        minLength={8}
                        value={emailSenha}
                        disabled={!canChangeEmailField}
                        onChange={(e) => setEmailSenha(e.target.value)}
                      />
                    </>
                  )}
                  <Button type="submit" disabled={!canChangeEmailField}>Alterar e-mail</Button>
                </form>
              </section>

              <section className="settings-group">
                <h2 className="settings-group-title">Senha e segurança</h2>
                <p className="muted small settings-group-desc">
                  {profile?.hasPassword
                    ? 'Altere sua senha de acesso por e-mail.'
                    : 'Conta Google ou sem senha local — defina uma senha para login por e-mail.'}
                </p>
                <form onSubmit={savePassword} className="settings-form-block" autoComplete="off">
                  {profile?.hasPassword && (
                    <>
                      <Label htmlFor="senhaAtual">Senha atual</Label>
                      <Input
                        id="senhaAtual"
                        name="gp-current-password"
                        type="password"
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        minLength={8}
                        value={senhaAtual}
                        aria-invalid={senhaAtualError ? true : undefined}
                        className={senhaAtualError ? 'field-invalid' : ''}
                        onChange={(e) => {
                          setSenhaAtual(e.target.value);
                          if (senhaAtualError) setSenhaAtualError(null);
                        }}
                      />
                      <FieldHint message={senhaAtualError} />
                    </>
                  )}
                  <Label htmlFor="senhaNova">Nova senha</Label>
                  <Input
                    id="senhaNova"
                    name="gp-new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={senhaNova}
                    onChange={(e) => setSenhaNova(e.target.value)}
                  />
                  <Button type="submit">{profile?.hasPassword ? 'Alterar senha' : 'Definir senha'}</Button>
                </form>
              </section>
            </>
          )}

          {section === 'privacidade' && (
            <section className="settings-group">
              <h2 className="settings-group-title">Chat</h2>
              <div className="settings-row">
                <div className="settings-row-main">
                  <span className="settings-row-label">Filtro de xingamentos</span>
                  <span className="muted small">Oculta palavras ofensivas nas mensagens que você vê.</span>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle"
                  checked={profile?.profanityFilterEnabled ?? true}
                  onChange={(e) => toggleSetting('profanityFilterEnabled', e.target.checked)}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-main">
                  <span className="settings-row-label">Aparecer online no chat</span>
                  <span className="muted small">Amigos e outros jogadores veem seu status online.</span>
                </div>
                <input
                  type="checkbox"
                  className="settings-toggle"
                  checked={profile?.chatOnline ?? true}
                  onChange={(e) => toggleSetting('chatOnline', e.target.checked)}
                />
              </div>
            </section>
          )}

          {section === 'aparencia' && (
            <section className="settings-group">
              <h2 className="settings-group-title">Personalização</h2>
              <form onSubmit={saveThemeLanguage} className="settings-form-block">
                <Label htmlFor="theme">Tema</Label>
                <select id="theme" name="theme" className="input" defaultValue={profile?.theme ?? 'dark'}>
                  <option value="dark">Escuro</option>
                  <option value="light">Claro</option>
                </select>
                <Label htmlFor="language">Idioma</Label>
                <select id="language" name="language" className="input" defaultValue={profile?.language ?? 'pt-BR'}>
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">English</option>
                  <option value="es-ES">Español</option>
                </select>
                <Button type="submit">Salvar alterações</Button>
              </form>
            </section>
          )}

          {section === 'favoritos' && (
            <section className="settings-group">
              <h2 className="settings-group-title">Seus jogos favoritos</h2>
              <p className="muted small settings-group-desc">
                Favorite jogos no lobby clicando na estrela ★ no card do jogo.
              </p>
              <div className="favorite-games">
                {favoriteGames.length === 0 && <span className="muted">Nenhum favorito ainda.</span>}
                {favoriteGames.map((g) => (
                  <Link
                    key={g.gameId}
                    to={g.lobbyRoomId ? `/salas/${g.lobbyRoomId}` : `/jogos/${g.slug}/lobby`}
                    className="favorite-chip"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
              <Link to="/" className="muted small">Explorar jogos →</Link>
            </section>
          )}

          {section === 'amigos' && (
            <>
              <section className="settings-group">
                <h2 className="settings-group-title">Amigos online</h2>
                <ul className="friends-list">
                  {friends.filter((f) => f.isOnline).length === 0 && (
                    <li className="muted settings-empty">Nenhum amigo online.</li>
                  )}
                  {friends.filter((f) => f.isOnline).map((f) => (
                    <li key={f.playerId} className="friend-item">
                      <Link to={`/jogadores/${f.playerId}`}>{f.displayName}</Link>
                      <Link to={`/mensagens/${f.playerId}`}>
                        <Button variant="ghost" className="btn-sm">Mensagem</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              {pendingFriends.length > 0 && (
                <section className="settings-group">
                  <h2 className="settings-group-title">Pedidos pendentes</h2>
                  <ul className="friends-list">
                    {pendingFriends.map((r) => (
                      <li key={r.requesterId} className="friend-item">
                        <span>{r.displayName}</span>
                        <Button variant="ghost" className="btn-sm" onClick={() => acceptFriend(r.requesterId)}>
                          Aceitar
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="settings-group">
                <h2 className="settings-group-title">Todos os amigos</h2>
                <ul className="friends-list">
                  {friends.length === 0 && (
                    <li className="muted settings-empty">Você ainda não tem amigos adicionados.</li>
                  )}
                  {friends.map((f) => (
                    <li key={f.playerId} className="friend-item">
                      <div className="settings-friend-meta">
                        <Link to={`/jogadores/${f.playerId}`}>{f.displayName}</Link>
                        <span className={`presence-dot ${f.isOnline ? 'online' : 'offline'}`} title={f.isOnline ? 'Online' : 'Offline'} />
                      </div>
                      <Link to={`/mensagens/${f.playerId}`}>
                        <Button variant="ghost" className="btn-sm">Mensagem</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {section === 'bloqueados' && (
            <section className="settings-group">
              <h2 className="settings-group-title">Usuários bloqueados</h2>
              <p className="muted small settings-group-desc">
                Jogadores bloqueados não podem enviar mensagens nem pedidos de amizade.
              </p>
              <ul className="blocked-list">
                {blocked.length === 0 && (
                  <li className="muted settings-empty">Nenhum usuário bloqueado.</li>
                )}
                {blocked.map((b) => (
                  <li key={b.playerId} className="blocked-item">
                    <span>{b.displayName}</span>
                    <Button variant="ghost" className="btn-sm" onClick={() => unblockPlayer(b.playerId)}>
                      Desbloquear
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
