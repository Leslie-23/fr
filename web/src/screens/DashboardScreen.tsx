import { firstDayOfTaxYear, startOfMonth, startOfQuarter } from '@domain/dates';
import type { ActivityEntry } from '@domain/entries';
import { sumByType } from '@domain/entries';
import { formatLe, todayIso } from '@domain/format';
import { softDeleteEntry } from '../storage/entriesRepository';

interface Props {
  entries: ActivityEntry[];
  onEntryChanged: () => void;
}

function StatCard({ label, entries, start, end }: { label: string; entries: ActivityEntry[]; start: string; end: string }) {
  const sales = sumByType(entries, 'sale', start, end);
  const expenses = sumByType(entries, 'expense', start, end);
  const net = sales - expenses;
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-net ${net >= 0 ? 'positive' : 'negative'}`}>{formatLe(net)}</span>
      <span className="stat-breakdown">
        <span className="sales-text">+{formatLe(sales)}</span>
        <span className="expense-text">-{formatLe(expenses)}</span>
      </span>
    </div>
  );
}

function relativeDate(entryDate: string, today: string): string {
  if (entryDate === today) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);
  if (entryDate === yesterdayIso) return 'Yesterday';
  return entryDate;
}

export function DashboardScreen({ entries, onEntryChanged }: Props) {
  const today = todayIso();

  function handleDelete(entry: ActivityEntry) {
    const label = `${entry.type === 'sale' ? 'Sale' : 'Expense'} of ${formatLe(entry.amountSle)} on ${entry.entryDate}`;
    if (!window.confirm(`Delete this entry?\n${label}`)) return;
    softDeleteEntry(entry.id);
    onEntryChanged();
  }

  return (
    <div className="screen">
      <p className="screen-eyebrow">Ledger summary</p>
      <h2>How business is going</h2>

      <div className="stat-grid">
        <StatCard label="Today" entries={entries} start={today} end={today} />
        <StatCard label="This month" entries={entries} start={startOfMonth(today)} end={today} />
        <StatCard label="This quarter" entries={entries} start={startOfQuarter(today)} end={today} />
        <StatCard label="Year to date" entries={entries} start={firstDayOfTaxYear(today)} end={today} />
      </div>

      <h3 className="list-heading">Recent entries</h3>
      {entries.length === 0 && (
        <p className="empty-text">Nothing logged yet. Use the Add tab to record your first sale or expense.</p>
      )}
      <ul className="entry-list">
        {entries.map((entry) => (
          <li key={entry.id} className="entry-row">
            <div>
              <div className="entry-date">{relativeDate(entry.entryDate, today)}</div>
              {entry.category && <div className="entry-category">{entry.category}</div>}
            </div>
            <div className="entry-actions">
              <span className={entry.type === 'sale' ? 'sales-text' : 'expense-text'}>
                {entry.type === 'sale' ? '+' : '-'}
                {formatLe(entry.amountSle)}
              </span>
              <button
                type="button"
                className="delete-button"
                onClick={() => handleDelete(entry)}
                aria-label={`Delete ${entry.type === 'sale' ? 'sale' : 'expense'} of ${formatLe(entry.amountSle)} on ${relativeDate(entry.entryDate, today)}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2L12 12M2 12L12 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
