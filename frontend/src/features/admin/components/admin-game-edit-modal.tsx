import { useEffect, useRef, useState } from 'react';
import { api, type AdminGameDetail } from '../../../shared/api/client';
import { Button, Input, Label } from '../../../shared/ui';

interface AdminGameEditModalProps {
  gameId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminGameEditModal({ gameId, onClose, onSaved }: AdminGameEditModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [game, setGame] = useState<AdminGameDetail | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState(true);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setPendingCover(null);
      return;
    }

    setLoading(true);
    setError(null);
    api.getAdminGame(gameId)
      .then((data) => {
        setGame(data);
        setName(data.name);
        setSlug(data.slug);
        setActive(data.active);
        setCoverPreview(data.coverDisplayUrl);
        setPendingCover(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar jogo'))
      .finally(() => setLoading(false));
  }, [gameId]);

  if (!gameId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gameId) return;

    setLoading(true);
    setError(null);
    try {
      if (pendingCover) {
        const uploaded = await api.uploadAdminGameCover(gameId, pendingCover);
        setCoverPreview(uploaded.coverUrl);
        setPendingCover(null);
      }

      await api.updateAdminGame(gameId, {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        active,
      });

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function onCoverSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingCover(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card admin-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-game-edit-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="admin-game-edit-title">Editar jogo</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </header>

        {loading && !game && <p className="muted">Carregando…</p>}
        {error && <p className="error">{error}</p>}

        {game && (
          <form onSubmit={handleSubmit} className="stack admin-edit-form">
            <div>
              <span className="settings-row-label">Capa da sala</span>
              <div className="settings-avatar-row" style={{ marginTop: '.5rem' }}>
                <div className="avatar-preview lg game-cover-preview">
                  {coverPreview ? (
                    <img src={coverPreview} alt="" />
                  ) : (
                    <span>{name.slice(0, 1)}</span>
                  )}
                </div>
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    id="admin-game-cover-input"
                    onChange={onCoverSelected}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="btn-sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    Alterar foto
                  </Button>
                  <p className="muted small">JPG, PNG, WEBP ou GIF — máx. 2 MB</p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-game-name">Nome do jogo</Label>
              <Input
                id="edit-game-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="edit-game-slug">Slug</Label>
              <Input
                id="edit-game-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                required
                maxLength={120}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Letras minúsculas, números e hífens"
              />
            </div>
            <label className="checkbox-row">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <span>
                Jogo ativo — chat do lobby visível para todos
              </span>
            </label>
            {!active && (
              <p className="muted small">
                Desativado: a sala de chat não fica aberta para os jogadores.
              </p>
            )}
            <div className="inline-actions">
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando…' : 'Salvar alterações'}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
