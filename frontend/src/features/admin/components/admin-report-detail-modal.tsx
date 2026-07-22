import { Link } from 'react-router-dom';
import type { AdminReport } from '../../../shared/api/client';
import { Button } from '../../../shared/ui';
import { REPORT_REASONS } from '../../social/components/report-player-modal';

const REASON_LABELS = Object.fromEntries(REPORT_REASONS.map((item) => [item.value, item.label])) as Record<string, string>;

interface AdminReportDetailModalProps {
  report: AdminReport | null;
  onClose: () => void;
}

export function AdminReportDetailModal({ report, onClose }: AdminReportDetailModalProps) {
  if (!report) return null;

  const reasonLabel = REASON_LABELS[report.reason] ?? report.reason;
  const createdAt = new Date(report.createdAt).toLocaleString('pt-BR');

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card admin-report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="report-detail-title">Denúncia</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </header>

        <dl className="report-detail-meta">
          <div>
            <dt>Denunciado</dt>
            <dd>
              <Link to={`/jogadores/${report.reported.playerId}`} onClick={onClose}>
                {report.reported.displayName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Denunciante</dt>
            <dd>
              <Link to={`/jogadores/${report.reporter.playerId}`} onClick={onClose}>
                {report.reporter.displayName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Motivo</dt>
            <dd>{reasonLabel}</dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>{createdAt}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{report.status === 'ABERTA' ? 'Aberta' : report.status}</dd>
          </div>
        </dl>

        <div className="report-detail-body">
          <h3>Descrição completa</h3>
          <div className="report-detail-text">
            {report.details?.trim() ? report.details : 'Nenhuma descrição informada.'}
          </div>
        </div>

        <div className="inline-actions">
          <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}

export function truncateReportDetails(text: string | null | undefined, maxLength = 72): string {
  const normalized = text?.trim();
  if (!normalized) return '—';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
}
