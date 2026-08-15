import { parseReceiptText } from './receiptParser';

describe('parseReceiptText', () => {
  it('prefers the amount on a "total" line over other numbers', () => {
    const text = ['SUPERMARKET', 'Rice 5kg        45,000', 'Oil 1L          30,000', 'Subtotal        75,000', 'Total           75,000', '2026-02-03'].join('\n');
    const draft = parseReceiptText(text, 'receipt-1.jpg', 'k1');
    expect(draft?.amountSle).toBe(75000);
    expect(draft?.entryDate).toBe('2026-02-03');
    expect(draft?.type).toBe('expense');
  });

  it('ignores a "subtotal" line when looking for the total', () => {
    const text = ['Subtotal   10,000', 'Tax        1,500', 'Total      11,500'].join('\n');
    const draft = parseReceiptText(text, 'r.jpg', 'k1');
    expect(draft?.amountSle).toBe(11500);
  });

  it('falls back to the largest number when there is no total line', () => {
    const text = ['Item A   2,000', 'Item B   9,500', 'Item C   3,000'].join('\n');
    const draft = parseReceiptText(text, 'r.jpg', 'k1');
    expect(draft?.amountSle).toBe(9500);
  });

  it('parses DD/MM/YYYY dates', () => {
    const text = 'Total 5,000\n03/02/2026';
    const draft = parseReceiptText(text, 'r.jpg', 'k1');
    expect(draft?.entryDate).toBe('2026-02-03');
  });

  it('returns null when no plausible amount is found', () => {
    const draft = parseReceiptText('thank you for shopping with us', 'r.jpg', 'k1');
    expect(draft).toBeNull();
  });
});
