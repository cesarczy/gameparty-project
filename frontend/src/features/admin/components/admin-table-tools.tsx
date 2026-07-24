import type { SortDirection } from '../lib/admin-table-utils';

export function AdminListSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="admin-list-search">
      <label className="muted small" htmlFor="admin-list-search">
        Filtrar lista
      </label>
      <input
        id="admin-list-search"
        className="input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function SortableTh({
  label,
  active,
  direction,
  onSort,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
}) {
  return (
    <th scope="col">
      <button type="button" className={`sortable-th ${active ? 'active' : ''}`} onClick={onSort}>
        <span>{label}</span>
        {active && <span className="sortable-th-indicator" aria-hidden>{direction === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}
