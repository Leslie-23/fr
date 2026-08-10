import { useRef, useState } from 'react';
import type { ActivityType } from '@domain/entries';
import { todayIso } from '@domain/format';
import { addEntry } from '../storage/entriesRepository';

const SALE_CATEGORIES = ['General sale', 'Service fee', 'Other income'];
const EXPENSE_CATEGORIES = ['Stock', 'Transport', 'Rent', 'Utilities', 'Wages', 'Other expense'];

interface Props {
  businessId: string;
  onSaved: () => void;
}

export function AddEntryScreen({ businessId, onSaved }: Props) {
  const [type, setType] = useState<ActivityType>('sale');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const saleOptionRef = useRef<HTMLButtonElement>(null);
  const expenseOptionRef = useRef<HTMLButtonElement>(null);

  const categories = type === 'sale' ? SALE_CATEGORIES : EXPENSE_CATEGORIES;

  function selectType(next: ActivityType) {
    setType(next);
    setCategory(undefined);
  }

  // Roving-tabindex per the ARIA radiogroup pattern: arrow keys move selection between
  // the two options, and only the selected option sits in the page's tab order.
  function handleSegmentedKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next: ActivityType = type === 'sale' ? 'expense' : 'sale';
    selectType(next);
    (next === 'sale' ? saleOptionRef : expenseOptionRef).current?.focus();
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const amountSle = Math.round(Number(amountText.replace(/[^0-9.]/g, '')));
    if (!amountSle || amountSle <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    addEntry({ businessId, entryDate: todayIso(), type, amountSle, category });
    setAmountText('');
    setCategory(undefined);
    setError(null);
    onSaved();
  }

  return (
    <form className="screen add-screen" onSubmit={handleSave}>
      <p className="screen-eyebrow">Today, {todayIso()}</p>
      <h2>What happened?</h2>

      <div className="segmented" role="radiogroup" aria-label="Entry type" onKeyDown={handleSegmentedKeyDown}>
        <button
          ref={saleOptionRef}
          type="button"
          role="radio"
          aria-checked={type === 'sale'}
          tabIndex={type === 'sale' ? 0 : -1}
          className={`segmented-option sale ${type === 'sale' ? 'active' : ''}`}
          onClick={() => selectType('sale')}
        >
          Money in
        </button>
        <button
          ref={expenseOptionRef}
          type="button"
          role="radio"
          aria-checked={type === 'expense'}
          tabIndex={type === 'expense' ? 0 : -1}
          className={`segmented-option expense ${type === 'expense' ? 'active' : ''}`}
          onClick={() => selectType('expense')}
        >
          Money out
        </button>
      </div>

      <label className="field-label" htmlFor="amount">
        Amount
      </label>
      <div className={`amount-field ${type}`}>
        <span className="currency-prefix">Le</span>
        <input
          id="amount"
          className="amount-input"
          inputMode="numeric"
          placeholder="0"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'amount-error' : undefined}
        />
      </div>
      {error && (
        <p className="error-text" id="amount-error" role="alert">
          {error}
        </p>
      )}

      <p className="field-label" id="category-label">
        Category, optional
      </p>
      <div className="tag-row" role="group" aria-labelledby="category-label">
        {categories.map((c) => (
          <button
            type="button"
            key={c}
            className={`tag ${category === c ? 'active' : ''}`}
            aria-pressed={category === c}
            onClick={() => setCategory(category === c ? undefined : c)}
          >
            {c}
          </button>
        ))}
      </div>

      <button type="submit" className={`save-button ${type}`}>
        Save {type === 'sale' ? 'sale' : 'expense'}
      </button>
    </form>
  );
}
