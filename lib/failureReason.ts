export function getFailureReason(notes: string | undefined): string {
  if (!notes) return 'Unknown';
  const normalized = notes
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '');

  const map: Record<string, string> = {
    not_ready: 'not ready',
    other: 'other',
    customer_is_not_home: "isn't home",
    shop_is_closed: 'is closed',
    did_not_fit: "didn't fit",
    too_heavy: 'too heavy',
    damaged: 'damaged',
    no_space: 'no space',
    incorrect_address: 'incorrect address',
  };

  for (const [key, label] of Object.entries(map)) {
    if (normalized.includes(key)) return label;
  }

  return notes.replace(/_/g, ' ').trim() || 'Unknown';
}
