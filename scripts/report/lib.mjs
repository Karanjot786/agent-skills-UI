export const pct = (n, d, digits = 1) => (d ? `${((n / d) * 100).toFixed(digits)}%` : 'n/a');

const cell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows, columns) =>
  columns.join(',') + '\n' + rows.map((r) => columns.map((c) => cell(r[c])).join(',')).join('\n') + (rows.length ? '\n' : '');
