import { useEffect, useMemo, useState } from 'react';
import { api, type AdminPlayer } from '../../../shared/api/client';
import { ALL_RANK_OPTIONS, AUTO_RANK_VALUE, ADMIN_RANK_OPTION, PRIMARY_ADMIN_RANK_OPTION, findRankOption, isPrimaryAdminUsername } from '../../../shared/constants/player-ranks';
import { Button, Input, Label, RankBadge } from '../../../shared/ui';

interface AdminPlayerEditModalProps {
  playerId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminPlayerEditModal({ playerId, onClose, onSaved }: AdminPlayerEditModalProps) {
  const [player, setPlayer] = useState<AdminPlayer | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'PLAYER' | 'ADMIN'>('PLAYER');
  const [country, setCountry] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [language, setLanguage] = useState<'pt-BR' | 'en-US' | 'es-ES'>('pt-BR');
  const [emailVerified, setEmailVerified] = useState(false);
  const [chatOnline, setChatOnline] = useState(true);
  const [rankSelection, setRankSelection] = useState<string>(AUTO_RANK_VALUE);
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      return;
    }

    setLoading(true);
    setError(null);
    api.getAdminPlayer(playerId)
      .then((data) => {
        setPlayer(data);
        setUsername(data.username);
        setEmail(data.email);
        setDisplayName(data.displayName);
        setRole(data.role as 'PLAYER' | 'ADMIN');
        setCountry(data.country ?? '');
        setBirthDate(data.birthDate ?? '');
        setLanguage(data.language as 'pt-BR' | 'en-US' | 'es-ES');
        setEmailVerified(data.emailVerified);
        setChatOnline(data.chatOnline);
        setRankSelection(data.rankId ?? AUTO_RANK_VALUE);
        setSenha('');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar jogador'))
      .finally(() => setLoading(false));
  }, [playerId]);

  const previewRank = useMemo(() => {
    if (isPrimaryAdminUsername(username)) return PRIMARY_ADMIN_RANK_OPTION;
    if (rankSelection === AUTO_RANK_VALUE) {
      if (role === 'ADMIN') return ADMIN_RANK_OPTION;
      return player?.rank ?? ALL_RANK_OPTIONS[0];
    }
    return findRankOption(rankSelection) ?? player?.rank ?? ALL_RANK_OPTIONS[0];
  }, [player, rankSelection, role, username]);

  if (!playerId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId) return;

    setLoading(true);
    setError(null);
    try {
      await api.updateAdminPlayer(playerId, {
        username: username.trim().toLowerCase(),
        email: email.trim(),
        displayName: displayName.trim(),
        role,
        country: country || null,
        birthDate: birthDate || null,
        language,
        emailVerified,
        chatOnline,
        rankId: rankSelection === AUTO_RANK_VALUE ? null : rankSelection,
        ...(senha.trim().length >= 8 ? { senha: senha.trim() } : {}),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card admin-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="admin-edit-title">Editar cadastro</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </header>

        {loading && !player && <p className="muted">Carregando…</p>}
        {error && <p className="error">{error}</p>}

        {player && (
          <form onSubmit={handleSubmit} className="stack admin-edit-form">
            <div>
              <Label htmlFor="edit-username">Nome de usuário</Label>
              <Input id="edit-username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required />
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="edit-displayName">Nome de exibição</Label>
              <Input id="edit-displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="edit-role">Papel</Label>
              <select id="edit-role" className="input" value={role} onChange={(e) => setRole(e.target.value as 'PLAYER' | 'ADMIN')}>
                <option value="PLAYER">PLAYER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-rank">Nível / insígnia</Label>
              <select
                id="edit-rank"
                className="input"
                value={rankSelection}
                onChange={(e) => setRankSelection(e.target.value)}
              >
                <optgroup label="Automático">
                  <option value={AUTO_RANK_VALUE}>
                    {isPrimaryAdminUsername(username)
                      ? 'Automático (Satoru Gojo — @admin)'
                      : role === 'ADMIN'
                        ? 'Por papel (Administrador + insígnia)'
                        : 'Por tempo na plataforma'}
                  </option>
                </optgroup>
                <optgroup label="Manual — fixar nível">
                  {ALL_RANK_OPTIONS.map((rank) => (
                    <option key={rank.id} value={rank.id}>{rank.label}</option>
                  ))}
                </optgroup>
              </select>
              {previewRank && (
                <div className="rank-preview-row">
                  <span className="muted small">
                    {rankSelection === AUTO_RANK_VALUE ? 'Prévia (automático):' : 'Prévia (manual):'}
                  </span>
                  <RankBadge rank={previewRank} />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="edit-country">País</Label>
              <Input id="edit-country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-birthDate">Data de nascimento</Label>
              <Input id="edit-birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-language">Idioma</Label>
              <select id="edit-language" className="input" value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">English</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-senha">Nova senha (opcional)</Label>
              <Input id="edit-senha" type="password" minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Deixe em branco para manter" />
            </div>
            <label className="checkbox-row">
              <input type="checkbox" checked={emailVerified} onChange={(e) => setEmailVerified(e.target.checked)} />
              <span>E-mail verificado</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={chatOnline} onChange={(e) => setChatOnline(e.target.checked)} />
              <span>Aparecer online no chat</span>
            </label>
            <div className="inline-actions">
              <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Salvar alterações'}</Button>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
