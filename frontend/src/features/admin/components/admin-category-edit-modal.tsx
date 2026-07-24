import { useEffect, useState } from 'react';
import { api, type AdminCategoryDetail } from '../../../shared/api/client';
import { Button, Input, Label } from '../../../shared/ui';

interface AdminCategoryEditModalProps {
  categoryId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminCategoryEditModal({ categoryId, onClose, onSaved }: AdminCategoryEditModalProps) {
  const [category, setCategory] = useState<AdminCategoryDetail | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setCategory(null);
      return;
    }

    setLoading(true);
    setError(null);
    api.getAdminCategory(categoryId)
      .then((data) => {
        setCategory(data);
        setName(data.name);
        setSlug(data.slug);
        setActive(data.active);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar categoria'))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (!categoryId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) return;

    setLoading(true);
    setError(null);
    try {
      await api.updateAdminCategory(categoryId, {
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
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card admin-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-category-edit-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="admin-category-edit-title">Editar categoria</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </header>

        {loading && !category && <p className="muted">Carregando…</p>}
        {error && <p className="error">{error}</p>}

        {category && (
          <form onSubmit={handleSubmit} className="stack admin-edit-form">
            <div>
              <Label htmlFor="edit-category-name">Nome da categoria</Label>
              <Input
                id="edit-category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={64}
              />
            </div>
            <div>
              <Label htmlFor="edit-category-slug">Slug</Label>
              <Input
                id="edit-category-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                required
                maxLength={64}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Letras minúsculas, números e hífens"
              />
            </div>
            <label className="checkbox-row">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <span>Categoria ativa — aparece no site e na listagem de jogos</span>
            </label>
            {!active && (
              <p className="muted small">
                Inativa: a categoria some do menu público; os jogos vinculados continuam no banco.
              </p>
            )}
            {category.linkedGamesCount > 0 && (
              <p className="muted small">
                {category.linkedGamesCount} jogo(s) vinculado(s) a esta categoria.
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
