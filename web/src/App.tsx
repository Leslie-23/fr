import { useCallback, useEffect, useState, type ReactElement } from 'react';
import './App.css';
import { AddEntryScreen } from './screens/AddEntryScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { TaxEstimateScreen } from './screens/TaxEstimateScreen';
import { getOrCreateDefaultBusiness } from './storage/businessRepository';
import { listEntries } from './storage/entriesRepository';
import type { ActivityEntry } from '@domain/entries';

type Tab = 'add' | 'dashboard' | 'tax';

const TABS: { key: Tab; label: string; icon: ReactElement }[] = [
  {
    key: 'add',
    label: 'Add',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 6.5V13.5M6.5 10H13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="10" width="3.4" height="7" rx="0.8" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8.3" y="6" width="3.4" height="11" rx="0.8" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13.6" y="3" width="3.4" height="14" rx="0.8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: 'tax',
    label: 'Tax estimate',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.2 2.2" />
        <path d="M7 13L13 7M7.6 8.4a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2zM12.4 13.8a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function App() {
  const [businessId] = useState(() => getOrCreateDefaultBusiness().id);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [tab, setTab] = useState<Tab>('add');

  const reloadEntries = useCallback(() => {
    setEntries(listEntries(businessId));
  }, [businessId]);

  useEffect(() => {
    reloadEntries();
  }, [reloadEntries]);

  return (
    <div className="page">
      <aside className="page-context" aria-hidden="true">
        <svg className="mark" width="34" height="34" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="13.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9.5 12.5H20.5M9.5 15.5H17M9.5 18.5H20.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <p className="context-line">
          Ledger takes its palette from gara — Sierra Leone&rsquo;s resist-dyed indigo cloth: paper for the daily
          record, indigo for structure, gold for what&rsquo;s owed.
        </p>
        <p className="context-meta">Designed mobile-first, shown here at phone width</p>
      </aside>

      <div className="device">
        <header className="device-header">
          <p className="eyebrow">Sierra Leone · Small &amp; Micro Traders</p>
          <div className="wordmark-row">
            <svg className="mark" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <circle cx="15" cy="15" r="13.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M9.5 12.5H20.5M9.5 15.5H17M9.5 18.5H20.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <h1>Ledger</h1>
          </div>
        </header>

        <main className="screen-area">
          {tab === 'add' && <AddEntryScreen businessId={businessId} onSaved={reloadEntries} />}
          {tab === 'dashboard' && <DashboardScreen entries={entries} onEntryChanged={reloadEntries} />}
          {tab === 'tax' && <TaxEstimateScreen businessId={businessId} entries={entries} />}
        </main>

        <nav className="tab-bar" aria-label="Screens">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tab-button ${tab === t.key ? 'active' : ''}`}
              aria-current={tab === t.key ? 'page' : undefined}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
