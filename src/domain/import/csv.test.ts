import { parseCsv } from './csv';

describe('parseCsv', () => {
  it('parses valid rows with ISO dates and sale/expense types', () => {
    const csv = 'date,type,amount,category\n2026-02-01,sale,15000,General sale\n2026-02-02,expense,5000,Transport\n';
    const { valid, errors } = parseCsv(csv, 'entries.csv');

    expect(errors).toHaveLength(0);
    expect(valid).toEqual([
      {
        key: 'entries.csv:2',
        entryDate: '2026-02-01',
        type: 'sale',
        amountSle: 15000,
        category: 'General sale',
        sourceLabel: 'entries.csv · row 2',
      },
      {
        key: 'entries.csv:3',
        entryDate: '2026-02-02',
        type: 'expense',
        amountSle: 5000,
        category: 'Transport',
        sourceLabel: 'entries.csv · row 3',
      },
    ]);
  });

  it('accepts income/in and expense/out as type synonyms', () => {
    const csv = 'date,type,amount\n2026-02-01,income,1000\n2026-02-01,out,1000\n';
    const { valid } = parseCsv(csv, 'x.csv');
    expect(valid.map((v) => v.type)).toEqual(['sale', 'expense']);
  });

  it('collects row errors for invalid date, type, and amount, and excludes them from valid', () => {
    const csv = 'date,type,amount\nnot-a-date,sale,1000\n2026-02-01,unknown,1000\n2026-02-01,sale,0\n';
    const { valid, errors } = parseCsv(csv, 'bad.csv');

    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(3);
    expect(errors[0]).toEqual({ rowNumber: 2, message: 'invalid date' });
    expect(errors[1]).toEqual({ rowNumber: 3, message: 'type must be "sale" or "expense"' });
    expect(errors[2]).toEqual({ rowNumber: 4, message: 'amount must be greater than 0' });
  });

  it('strips currency formatting from amounts', () => {
    const csv = 'date,type,amount\n2026-02-01,sale,"Le 1,250,000"\n';
    const { valid } = parseCsv(csv, 'x.csv');
    expect(valid[0].amountSle).toBe(1250000);
  });
});
