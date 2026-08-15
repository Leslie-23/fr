export function formatLe(amountSle: number): string {
  return `Le ${amountSle.toLocaleString('en-US')}`;
}

export function todayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
