export function generateInviteCode(name = 'user') {
  const base = String(name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || 'user';
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `${base}${suffix}`;
}
