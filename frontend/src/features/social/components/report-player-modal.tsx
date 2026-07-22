import { useState } from 'react';
import { api } from '../../../shared/api/client';
import { Button, Input, Label } from '../../../shared/ui';

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'TOXICIDADE', label: 'Toxicidade' },
  { value: 'OFENSA', label: 'Ofensa' },
  { value: 'ASSEDIO', label: 'Assédio' },
  { value: 'HACK', label: 'Trapaça / hack' },
  { value: 'FAKE', label: 'Perfil falso' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

type ReportReason = typeof REPORT_REASONS[number]['value'];

interface ReportPlayerModalProps {
  reportedId: string;
  reportedName: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReportPlayerModal({
  reportedId,
  reportedName,
  open,
  onClose,
  onSuccess,
}: ReportPlayerModalProps) {
  const [reason, setReason] = useState<ReportReason>('TOXICIDADE');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (details.trim().length < 10) {
      setError('Descreva a denúncia com pelo menos 10 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.reportPlayer({
        reportedId,
        reason,
        details: details.trim(),
      });
      setSuccess('Denúncia enviada. Nossa equipe irá analisar.');
      onSuccess?.();
      window.setTimeout(() => {
        setDetails('');
        setReason('TOXICIDADE');
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar denúncia');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="report-title">Denunciar {reportedName}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </header>

        <form onSubmit={handleSubmit} className="stack">
          <div>
            <Label htmlFor="report-reason">Motivo</Label>
            <select
              id="report-reason"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              required
            >
              {REPORT_REASONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="report-details">Descreva o ocorrido</Label>
            <textarea
              id="report-details"
              className="input report-textarea"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Conte o que aconteceu com o máximo de detalhes possível…"
              minLength={10}
              maxLength={2000}
              rows={5}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          {success && <p className="success-banner">{success}</p>}
          <div className="inline-actions">
            <Button type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar denúncia'}</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { REPORT_REASONS };
