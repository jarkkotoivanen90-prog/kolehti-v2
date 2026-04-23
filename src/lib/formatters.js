export function formatCurrency(value = 0) {
  return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function formatNumber(value = 0) {
  return new Intl.NumberFormat('fi-FI').format(Number(value || 0));
}

export function formatPercent(value = 0) {
  return `${Number(value || 0).toFixed(1)} %`;
}
