export function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

export function toDateInputValue(iso?: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}
